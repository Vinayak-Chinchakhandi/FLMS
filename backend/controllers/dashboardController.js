// ─── Dashboard Controller ─────────────────────────────────────────────────────

import {
  getDepartments, getUsers, getLeaveRequests, getDeptScores, getTimetable,
} from '../utils/dataLayer.js';

// GET /api/dashboard/heatmap
export const getHeatmap = async (req, res) => {
  try {
    const [departments, users, leaveRequests, deptScores] = await Promise.all([
      getDepartments(), getUsers(), getLeaveRequests(), getDeptScores(),
    ]);

    const heatmap = departments.map((dept) => {
      const facultyInDept = users
        .filter((u) => u.department_id === dept.id && u.role === 'faculty')
        .map((u) => u.id);

      const leavesByDate = {};
      leaveRequests
        .filter((lr) => facultyInDept.includes(lr.faculty_id))
        .forEach((lr) => {
          const key = lr.from_date instanceof Date
            ? lr.from_date.toISOString().split('T')[0]
            : String(lr.from_date).split('T')[0];
          if (!leavesByDate[key]) leavesByDate[key] = { count: 0, totalImpact: 0 };
          leavesByDate[key].count++;
          leavesByDate[key].totalImpact += Number(lr.impact_score) || 0;
        });

      const deptScoreData = deptScores.filter((ds) => ds.department_id === dept.id);

      return {
        departmentId:   dept.id,
        departmentName: dept.name,
        facultyCount:   facultyInDept.length,
        leaveActivity:  Object.entries(leavesByDate).map(([date, data]) => ({
          date,
          count:     data.count,
          avgImpact: parseFloat((data.totalImpact / data.count).toFixed(2)),
        })),
        performanceScores: deptScoreData.map((ds) => ({
          date:  ds.date instanceof Date ? ds.date.toISOString().split('T')[0] : String(ds.date).split('T')[0],
          score: ds.score,
        })),
      };
    });

    const totalLeaves   = leaveRequests.length;
    const pendingLeaves = leaveRequests.filter((lr) => lr.status === 'pending').length;
    const avgImpact     = totalLeaves
      ? parseFloat(
          (leaveRequests.reduce((s, lr) => s + (Number(lr.impact_score) || 0), 0) / totalLeaves).toFixed(2)
        )
      : 0;

    res.json({
      success: true,
      data: {
        summary: { totalLeaves, pendingLeaves, avgImpact },
        heatmap,
      },
    });
  } catch (err) {
    console.error('[getHeatmap]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const [departments, users, leaveRequests, deptScores, allSlots] = await Promise.all([
      getDepartments(), getUsers(), getLeaveRequests(), getDeptScores(), getTimetable(),
    ]);

    const leaderboard = departments.map((dept) => {
      const facultyInDept = users
        .filter((u) => u.department_id === dept.id && u.role === 'faculty')
        .map((u) => u.id);

      const deptLeaves = leaveRequests.filter((lr) => facultyInDept.includes(lr.faculty_id));
      const approved   = deptLeaves.filter((lr) => lr.status === 'approved').length;
      const pending    = deptLeaves.filter((lr) => lr.status === 'pending').length;
      const rejected   = deptLeaves.filter((lr) => lr.status === 'rejected').length;
      const totalLeaves = deptLeaves.length;

      const avgImpact = totalLeaves
        ? parseFloat(
            (deptLeaves.reduce((s, lr) => s + (Number(lr.impact_score) || 0), 0) / totalLeaves).toFixed(2)
          )
        : 0;

      const avgLoad = facultyInDept.length
        ? parseFloat(
            (facultyInDept.reduce((s, id) => s + allSlots.filter((t) => t.faculty_id === id).length, 0)
              / facultyInDept.length).toFixed(1)
          )
        : 0;

      const latestScore = deptScores
        .filter((ds) => ds.department_id === dept.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.score ?? 0;

      const responsibilityScore = Math.max(0, latestScore - avgImpact * 2 - pending * 5);

      return {
        departmentId:        dept.id,
        departmentName:      dept.name,
        facultyCount:        facultyInDept.length,
        totalLeaves,
        approved, pending, rejected,
        avgImpactScore:      avgImpact,
        avgFacultyLoad:      avgLoad,
        performanceScore:    latestScore,
        responsibilityScore: parseFloat(responsibilityScore.toFixed(1)),
      };
    });

    leaderboard.sort((a, b) => b.responsibilityScore - a.responsibilityScore);
    leaderboard.forEach((e, i) => { e.rank = i + 1; });

    res.json({ success: true, data: leaderboard });
  } catch (err) {
    console.error('[getLeaderboard]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
