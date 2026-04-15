// ─── Leave Controller ─────────────────────────────────────────────────────────

import {
  getLeaveRequests, getLeaveById as fetchLeaveById,
  createLeaveRequest, updateLeaveStatus as setLeaveStatus,
  getUserById,
} from '../utils/dataLayer.js';
import { evaluateLeave } from '../services/smartEngine.js';

// POST /api/leave/apply
export const applyLeave = async (req, res) => {
  try {
    const { faculty_id, from_date, to_date, reason } = req.body;

    if (!faculty_id || !from_date || !to_date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: faculty_id, from_date, to_date, reason',
      });
    }

    const faculty = await getUserById(Number(faculty_id));
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({ success: false, message: 'from_date must be ≤ to_date' });
    }

    const evaluation = await evaluateLeave(Number(faculty_id), from_date, to_date, reason);

    const impact_score = parseFloat(((100 - evaluation.approvalScore) / 10).toFixed(2));
    const newRequest   = await createLeaveRequest({ faculty_id, from_date, to_date, reason, impact_score });

    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: {
        leaveRequest: newRequest,
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

// PATCH /api/leave/:id/status
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['approved', 'rejected', 'pending'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }
    const leave = await setLeaveStatus(Number(req.params.id), status);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    res.json({ success: true, message: `Status updated to "${status}"`, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
