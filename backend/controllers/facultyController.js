import {
  getLeavesByFaculty, getTimetableByFaculty,
  getSubstitutionsByFaculty, getExtraClassesByFaculty,
  getUserById,
} from '../utils/dataLayer.js';
import { revertExpiredActingHods } from './leaveController.js';

// GET /api/faculty/dashboard/:id
export const getFacultyDashboard = async (req, res) => {
  try {
    // Auto-revert expired acting HOD assignments on every dashboard load
    await revertExpiredActingHods();

    const facultyId = Number(req.params.id);

    // A user can only view their own faculty dashboard.
    // HODs (actual or acting) cannot view another person's faculty dashboard via this endpoint.
    if (req.user.id !== facultyId) {
      return res.status(403).json({ success: false, message: 'Forbidden: can only view your own dashboard' });
    }

    const [user, leaves, timetable, substitutions, extraClasses] = await Promise.all([
      getUserById(facultyId),
      getLeavesByFaculty(facultyId),
      getTimetableByFaculty(facultyId),
      getSubstitutionsByFaculty(facultyId),
      getExtraClassesByFaculty(facultyId),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    const summary = {
      totalLeaves:            leaves.length,
      pending:                leaves.filter((l) => l.status === 'pending').length,
      approved:               leaves.filter((l) => l.status === 'approved').length,
      rejected:               leaves.filter((l) => l.status === 'rejected').length,
      assignedSubstitutions:  substitutions.filter((s) => s.status === 'assigned').length,
      acceptedSubstitutions:  substitutions.filter((s) => s.status === 'accepted').length,
      // Load info
      normalLoad:             timetable.length,
      extraLoad:              extraClasses.length,
      // Leave quota
      maxLeaves:              user.max_leaves  ?? 12,
      leavesTaken:            user.leaves_taken ?? 0,
      leavesRemaining:        (user.max_leaves ?? 12) - (user.leaves_taken ?? 0),
    };

    return res.json({
      success: true,
      data: {
        user: {
          id:            user.id,
          name:          user.name,
          role:          user.role,
          acting_role:   user.acting_role ?? null,
          department_id: user.department_id,
          max_leaves:    user.max_leaves  ?? 12,
          leaves_taken:  user.leaves_taken ?? 0,
        },
        summary,
        leaves,
        timetable,       // original permanent schedule
        extraClasses,    // TEMPORARY accepted substitution classes
        substitutions,   // all substitution assignments (pending + accepted)
      },
    });
  } catch (err) {
    console.error('[getFacultyDashboard]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
