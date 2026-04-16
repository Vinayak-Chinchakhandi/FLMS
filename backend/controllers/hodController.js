import { getLeavesByDepartment, getDepartmentById, getUsersByDepartment } from '../utils/dataLayer.js';

export const getHodDashboard = async (req, res) => {
  try {
    const departmentId = Number(req.params.departmentId);
    if (!req.user || req.user.role !== 'hod' || req.user.department_id !== departmentId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [department, leaves, members] = await Promise.all([
      getDepartmentById(departmentId),
      getLeavesByDepartment(departmentId),
      getUsersByDepartment(departmentId),
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

    // Enrich leaves with faculty name (if not already joined via DB)
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
        summary: {
          totalLeaves: leaves.length,
          pending: statusCount.pending,
          approved: statusCount.approved,
          rejected: statusCount.rejected,
          averageImpact,
        },
      },
    });
  } catch (err) {
    console.error('[getHodDashboard]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
