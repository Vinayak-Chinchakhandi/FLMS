// ─── Leave Controller ─────────────────────────────────────────────────────────

import {
  getLeaveRequests, getLeaveById as fetchLeaveById,
  createLeaveRequest, updateLeaveStatus as setLeaveStatus,
  getUserById, createSubstitution,
  incrementLeavesTaken, setUserActingRole,
  createActingHodAssignment, getActingHodAssignment, deactivateActingHodAssignment,
  getActiveActingHodAssignments,
} from '../utils/dataLayer.js';
import { evaluateLeave } from '../services/smartEngine.js';
import { runSimulation } from '../services/simulationService.js';
import { timetable } from '../utils/mockData.js';

// Helper: look up timetable slot for a class to enrich substitution records
function getTimetableDetails(facultyId, classId) {
  return timetable.find(
    (t) => t.faculty_id === Number(facultyId) && t.class_id === classId
  ) || null;
}

// ─── Helper: run full approval workflow ────────────────────────────────────────
// Shared between HOD auto-approval and the PATCH /status endpoint.
async function runApproveWorkflow(leaveId, leave) {
  const workflow = {};

  // 1. Increment leave quota counter
  await incrementLeavesTaken(leave.faculty_id, leave.from_date,leave.to_date);

  // 2. Run AI simulation and create substitute assignments
  const simulation = await runSimulation(Number(leave.faculty_id), leave.from_date, leave.to_date);
  workflow.simulation = simulation;

  for (const sub of simulation.substitutions.filter((s) => s.status === 'ASSIGNED' && s.substitute?.id)) {
    const slotDetails = getTimetableDetails(leave.faculty_id, sub.classId);
    const created = await createSubstitution({
      leave_id:              leaveId,
      original_faculty_id:   Number(leave.faculty_id),
      substitute_faculty_id: Number(sub.substitute.id),
      class_id:              sub.classId,
      subject:               sub.subject || slotDetails?.subject || '',
      day:                   sub.day     || slotDetails?.day     || '',
      start_time:            slotDetails?.start_time || '',
      end_time:              slotDetails?.end_time   || '',
      date:                  leave.from_date,
      status:                'assigned',
    });
    console.log('[Substitution] Assigned', created);
  }

  // 3. HOD leave: assign acting HOD automatically (no confirmation needed)
  if (leave.is_hod_leave && leave.acting_hod_id) {
    const actingHodId   = Number(leave.acting_hod_id);
    const originalHodId = Number(leave.faculty_id);
    const deptId        = Number(leave.department_id);

    // Deactivate any existing active assignment for this dept first
    const existing = await getActingHodAssignment(deptId);
    if (existing) {
      await deactivateActingHodAssignment(existing.id);
      if (existing.acting_hod_id !== actingHodId) {
        await setUserActingRole(existing.acting_hod_id, null);
      }
    }

    await createActingHodAssignment({
      department_id:  deptId,
      original_hod_id: originalHodId,
      acting_hod_id:  actingHodId,
      from_date:      leave.from_date,
      to_date:        leave.to_date,
    });
    await setUserActingRole(actingHodId, 'hod');

    console.log(`[ActingHOD] Faculty ${actingHodId} granted acting_role=hod for dept ${deptId}`);
    workflow.actingHod = { assigned: true, acting_hod_id: actingHodId, from_date: leave.from_date, to_date: leave.to_date };
  }

  workflow.message = 'Leave approved and substitution workflow started';
  return workflow;
}

// ─── Helper: auto-revert expired acting HOD assignments ───────────────────────
// Called on every dashboard/leave fetch so no cron job is required.
export async function revertExpiredActingHods() {
  const today = new Date().toISOString().split('T')[0];
  const activeAssignments = await getActiveActingHodAssignments();
  for (const assignment of activeAssignments) {
    const toDate = assignment.to_date instanceof Date
      ? assignment.to_date.toISOString().split('T')[0]
      : String(assignment.to_date || '').split('T')[0];
    if (toDate && toDate < today) {
      await deactivateActingHodAssignment(assignment.id);
      await setUserActingRole(assignment.acting_hod_id, null);
      console.log(`[AutoRevert] Acting HOD assignment ${assignment.id} expired — role removed from user ${assignment.acting_hod_id}`);
    }
  }
}

// POST /api/leave/apply
export const applyLeave = async (req, res) => {
  try {
    const { faculty_id, from_date, to_date, reason, acting_hod_id = null } = req.body;

    if (!faculty_id || !from_date || !to_date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: faculty_id, from_date, to_date, reason',
      });
    }

    const faculty = await getUserById(Number(faculty_id));
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    // ── Leave quota check ──────────────────────────────────────────────────
    const maxLeaves   = faculty.max_leaves   ?? 12;
    const leavesTaken = faculty.leaves_taken ?? 0;

    if (leavesTaken >= maxLeaves) {
      return res.status(400).json({
        success: false,
        message: `Leave quota exceeded. You have used ${leavesTaken} of ${maxLeaves} allowed leaves this year.`,
        data: { leavesTaken, maxLeaves, remaining: 0 },
      });
    }

    if (new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({ success: false, message: 'from_date must be ≤ to_date' });
    }

    // ── Determine if this is an HOD leave ─────────────────────────────────
    const isHodLeave = faculty.role === 'hod';

    // HOD leave REQUIRES acting_hod_id — enforce it strictly
    if (isHodLeave && !acting_hod_id) {
      return res.status(400).json({
        success: false,
        message: 'HOD leave requires selecting an Acting HOD (acting_hod_id is required).',
      });
    }

    // Validate acting HOD is faculty in same department
    if (isHodLeave && acting_hod_id) {
      const actingHod = await getUserById(Number(acting_hod_id));
      if (!actingHod || actingHod.role !== 'faculty' || actingHod.department_id !== faculty.department_id) {
        return res.status(400).json({
          success: false,
          message: 'Acting HOD must be a faculty member in the same department.',
        });
      }
    }

    const evaluation = await evaluateLeave(Number(faculty_id), from_date, to_date, reason);
    const impact_score = parseFloat(((100 - evaluation.approvalScore) / 10).toFixed(2));

    // ── HOD leave: create as APPROVED immediately ──────────────────────────
    if (isHodLeave) {
      const newRequest = await createLeaveRequest({
        faculty_id,
        from_date,
        to_date,
        reason,
        impact_score,
        is_hod_leave:  true,
        acting_hod_id: Number(acting_hod_id),
        status_override: 'approved', // signals dataLayer to set approved directly
      });

      // Run approval workflow immediately
      const workflow = await runApproveWorkflow(newRequest.id, newRequest);

      // Get acting HOD name for response
      const actingUser = await getUserById(Number(acting_hod_id));

      return res.status(201).json({
        success: true,
        message: 'Leave approved and Acting HOD assigned',
        data: {
          leaveRequest: newRequest,
          autoApproved: true,
          actingHodName: actingUser?.name || 'Selected faculty',
          leaveQuota: { max: maxLeaves, taken: leavesTaken + 1, remaining: maxLeaves - leavesTaken - 1 },
          quickEvaluation: {
            approvalScore:   evaluation.approvalScore,
            recommendation:  evaluation.recommendation,
            affectedClasses: evaluation.affectedClassesCount,
            conflictsFound:  evaluation.conflicts.length,
          },
          workflow,
        },
      });
    }

    // ── Faculty leave: create as PENDING — awaits HOD action ──────────────
    const newRequest = await createLeaveRequest({
      faculty_id,
      from_date,
      to_date,
      reason,
      impact_score,
      is_hod_leave:  false,
      acting_hod_id: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Leave request sent for approval',
      data: {
        leaveRequest: newRequest,
        autoApproved: false,
        leaveQuota: {
          max: maxLeaves,
          taken: leavesTaken,
          remaining: maxLeaves - leavesTaken,
        },
        quickEvaluation: {
          approvalScore:   evaluation.approvalScore,
          recommendation:  evaluation.recommendation,
          affectedClasses: evaluation.affectedClassesCount,
          conflictsFound:  evaluation.conflicts.length,
        },
      },
    });
  } catch (err) {
    console.error('[applyLeave]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/leave
export const getAllLeaves = async (req, res) => {
  try {
    await revertExpiredActingHods();
    const leaves = await getLeaveRequests();
    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/leave/:id
export const getLeaveById = async (req, res) => {
  try {
    const leave = await fetchLeaveById(Number(req.params.id));
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/leave/:id/status  — HOD approves/rejects FACULTY leave
export const updateLeaveStatus = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const { status } = req.body;
    const allowed = ['approved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }

    const leave = await fetchLeaveById(leaveId);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

    // Prevent re-processing already decided leaves
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave is already ${leave.status}. Cannot change status again.`,
      });
    }

    // HOD leave is auto-approved at apply time — should never reach here
    if (leave.is_hod_leave) {
      return res.status(400).json({
        success: false,
        message: 'HOD leaves are auto-approved at submission time and cannot be manually changed.',
      });
    }

    // Auth check: only HOD (actual or acting) of same department can approve
    const isActualHod = req.user?.role === 'hod';
    const isActingHod = req.user?.acting_role === 'hod';
    if (!isActualHod && !isActingHod) {
      return res.status(403).json({ success: false, message: 'Only HOD can change leave status' });
    }
    if (req.user.department_id !== Number(leave.department_id)) {
      return res.status(403).json({ success: false, message: 'HOD can only manage leaves for their own department' });
    }

    // Update status
    const updatedLeave = await setLeaveStatus(leaveId, status);
    if (!updatedLeave) return res.status(404).json({ success: false, message: 'Leave not found after update' });

    let workflow = { leave: updatedLeave };

    if (status === 'approved') {
      workflow = { ...workflow, ...(await runApproveWorkflow(leaveId, leave)) };
      workflow.leave = updatedLeave;
    }

    return res.json({ success: true, data: workflow });
  } catch (err) {
    console.error('[updateLeaveStatus]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
