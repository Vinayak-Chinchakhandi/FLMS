import { getLeavesByFaculty, getTimetableByFaculty, getSubstitutionsByFaculty, getUserById } from '../utils/dataLayer.js';

export const getFacultyDashboard = async (req, res) => {
  try {
    const facultyId = Number(req.params.id);
    if (!req.user || req.user.role !== 'faculty' || req.user.id !== facultyId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [user, leaves, timetable, substitutions] = await Promise.all([
      getUserById(facultyId),
      getLeavesByFaculty(facultyId),
      getTimetableByFaculty(facultyId),
      getSubstitutionsByFaculty(facultyId),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    const summary = {
      totalLeaves: leaves.length,
      pending: leaves.filter((l) => l.status === 'pending').length,
      approved: leaves.filter((l) => l.status === 'approved').length,
      rejected: leaves.filter((l) => l.status === 'rejected').length,
      assignedSubstitutions: substitutions.filter((s) => s.status === 'assigned').length,
      acceptedSubstitutions: substitutions.filter((s) => s.status === 'accepted').length,
    };

    return res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, role: user.role, department_id: user.department_id },
        summary,
        leaves,
        timetable,
        substitutions,
      },
    });
  } catch (err) {
    console.error('[getFacultyDashboard]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
