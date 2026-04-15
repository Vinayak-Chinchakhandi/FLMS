// ─── Substitute Suggestion Engine ────────────────────────────────────────────
// Score = (subject_match * 0.4) + (availability * 0.3) + (workload_balance * 0.3)

import { getUsers, getTimetable } from '../utils/dataLayer.js';
import { isFacultyAvailable, getFacultyCurrentLoad, getMaxLoad } from '../utils/helpers.js';

export const suggestSubstitutes = async (originalFacultyId, affectedClasses, fromDate, toDate) => {
  const subjects  = [...new Set(affectedClasses.map((c) => c.subject))];
  const maxLoad   = await getMaxLoad();
  const allUsers  = await getUsers();
  const allSlots  = await getTimetable();

  const candidates = allUsers.filter(
    (u) => u.role === 'faculty' && u.id !== Number(originalFacultyId)
  );

  const scored = await Promise.all(
    candidates.map(async (faculty) => {
      // Subject match
      const taughtSubjects = allSlots
        .filter((t) => t.faculty_id === faculty.id)
        .map((t) => t.subject);
      const matchCount   = subjects.filter((s) => taughtSubjects.includes(s)).length;
      const subjectMatch = subjects.length ? matchCount / subjects.length : 0;

      // Availability
      const available      = await isFacultyAvailable(faculty.id, fromDate, toDate);
      const availabilityVal = available ? 1 : 0;

      // Workload balance
      const currentLoad     = await getFacultyCurrentLoad(faculty.id);
      const workloadBalance = 1 - currentLoad / maxLoad;

      const score =
        subjectMatch    * 0.4 +
        availabilityVal * 0.3 +
        workloadBalance * 0.3;

      return {
        facultyId:    faculty.id,
        name:         faculty.name,
        email:        faculty.email,
        department:   faculty.department_id,
        score:        parseFloat(score.toFixed(3)),
        subjectMatch: parseFloat(subjectMatch.toFixed(3)),
        available,
        currentLoad,
      };
    })
  );

  return scored
    .filter((c) => c.available)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};
