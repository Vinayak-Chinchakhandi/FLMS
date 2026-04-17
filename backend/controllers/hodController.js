import {
  getLeavesByDepartment, getDepartmentById, getUsersByDepartment,
  getSubstitutionsByLeave, getActingHodAssignment, getUserById,
} from '../utils/dataLayer.js';
import { revertExpiredActingHods } from './leaveController.js';

// GET /api/hod/dashboard/:departmentId
export const getHodDashboard = async (req, res) => {
  try {
    // Auto-revert expired acting HOD assignments
    await revertExpiredActingHods();

    const departmentId = Number(req.params.departmentId);

    // Allow actual HOD or acting HOD for this department
    const isActualHod = req.user?.role === 'hod' && req.user.department_id === departmentId;
    const isActingHod = req.user?.acting_role === 'hod' && req.user.department_id === departmentId;
    if (!isActualHod && !isActingHod) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [department, leaves, members, actingAssignment] = await Promise.all([
      getDepartmentById(departmentId),
      getLeavesByDepartment(departmentId),
      getUsersByDepartment(departmentId),
      getActingHodAssignment(departmentId),
    ]);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const statusCount = leaves.reduce(
      (acc, leave) => {
        acc[leave.status] = (acc[leave.status] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );

    const averageImpact = leaves.length
      ? parseFloat((leaves.reduce((sum, leave) => sum + (Number(leave.impact_score) || 0), 0) / leaves.length).toFixed(2))
      : 0;

    // Enrich leaves with faculty name
    const membersMap = Object.fromEntries(members.map((m) => [m.id, m.name]));
    const enrichedLeaves = leaves.map((l) => ({
      ...l,
      faculty_name: l.faculty_name || membersMap[Number(l.faculty_id)] || 'Unknown',
    }));

    return res.json({
      success: true,
      data: {
        department: {
          id: department.id,
          name: department.name,
          hod_id: department.hod_id,
        },
        members,
        leaves: enrichedLeaves,
        actingHod: actingAssignment
          ? {
              active:         actingAssignment.active,
              acting_hod_id:  actingAssignment.acting_hod_id,
              from_date:      actingAssignment.from_date,
              to_date:        actingAssignment.to_date,
            }
          : null,
        summary: {
          totalLeaves:  leaves.length,
          pending:      statusCount.pending,
          approved:     statusCount.approved,
          rejected:     statusCount.rejected,
          averageImpact,
        },
      },
    });
  } catch (err) {
    console.error('[getHodDashboard]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/hod/substitution-status/:leaveId
// Returns substitution acceptance progress for a specific leave
export const getSubstitutionStatus = async (req, res) => {
  try {
    const leaveId = Number(req.params.leaveId);
    const subs = await getSubstitutionsByLeave(leaveId);

    const total    = subs.length;
    const accepted = subs.filter((s) => s.status === 'accepted').length;
    const assigned = subs.filter((s) => s.status === 'assigned').length;
    const rejected = subs.filter((s) => s.status === 'rejected').length;

    return res.json({
      success: true,
      data: {
        leaveId,
        total,
        accepted,
        pending: assigned,
        rejected,
        progress: total > 0 ? Math.round((accepted / total) * 100) : 0,
        substitutions: subs.map((s) => ({
          id:              s.id,
          class_id:        s.class_id,
          subject:         s.subject,
          day:             s.day,
          start_time:      s.start_time,
          end_time:        s.end_time,
          date:            s.date,
          substituteName:  s.substituteName,
          status:          s.status,
        })),
      },
    });
  } catch (err) {
    console.error('[getSubstitutionStatus]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/hod/acting/:departmentId
// Returns current acting HOD info if active
export const getActingHod = async (req, res) => {
  try {
    const departmentId = Number(req.params.departmentId);
    const [assignment, department] = await Promise.all([
      getActingHodAssignment(departmentId),
      getDepartmentById(departmentId),
    ]);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    let hod = null;
    let actingHod = null;

    if (assignment) {
      const [hodUser, actingUser] = await Promise.all([
        getUserById(assignment.original_hod_id),
        getUserById(assignment.acting_hod_id),
      ]);
      hod = hodUser ? { id: hodUser.id, name: hodUser.name } : null;
      actingHod = actingUser ? { id: actingUser.id, name: actingUser.name } : null;
    }

    return res.json({
      success: true,
      data: {
        department: { id: department.id, name: department.name },
        active:    !!assignment,
        hod,
        actingHod,
        from_date: assignment?.from_date || null,
        to_date:   assignment?.to_date   || null,
      },
    });
  } catch (err) {
    console.error('[getActingHod]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
