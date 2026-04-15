// ─── Smart Leave Evaluation Engine ───────────────────────────────────────────
// approvalScore, conflicts, suggestedSubstitutes, recommendation

import { getLeaveRequests, getUserById } from '../utils/dataLayer.js';
import { getAffectedClasses }            from '../utils/helpers.js';
import { suggestSubstitutes }            from './substituteService.js';

export const evaluateLeave = async (facultyId, fromDate, toDate, reason) => {
  const faculty = await getUserById(facultyId);
  if (!faculty) throw new Error(`Faculty with id ${facultyId} not found`);

  const affectedClasses = await getAffectedClasses(facultyId, fromDate, toDate);
  const allLeaves       = await getLeaveRequests();

  // ── Conflict detection ────────────────────────────────────────────────────
  const conflicts = [];

  const existingLeave = allLeaves.find(
    (r) =>
      r.faculty_id === Number(facultyId) &&
      ['approved', 'pending'].includes(r.status) &&
      r.from_date <= toDate &&
      r.to_date   >= fromDate
  );
  if (existingLeave) {
    conflicts.push({
      type:    'DUPLICATE_LEAVE',
      message: `Overlapping leave request (id: ${existingLeave.id}) already exists`,
    });
  }

  // Check per-class substitute availability
  for (const cls of affectedClasses) {
    const subs = await suggestSubstitutes(facultyId, [cls], fromDate, toDate);
    if (subs.length === 0) {
      conflicts.push({
        type:    'NO_SUBSTITUTE',
        message: `No available substitute for ${cls.subject} on ${cls.day} (${cls.class_id})`,
      });
    }
  }

  // ── Approval score ────────────────────────────────────────────────────────
  let approvalScore = 100;
  approvalScore -= conflicts.length * 15;
  approvalScore -= affectedClasses.length * 5;

  const leaveDuration =
    (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24) + 1;
  if (leaveDuration <= 2) approvalScore += 10;

  approvalScore = Math.max(0, Math.min(100, approvalScore));

  const suggestedSubstitutesResult = await suggestSubstitutes(facultyId, affectedClasses, fromDate, toDate);

  let recommendation;
  if (approvalScore >= 75)      recommendation = 'APPROVE';
  else if (approvalScore >= 50) recommendation = 'REVIEW';
  else                          recommendation = 'REJECT';

  return {
    facultyId,
    facultyName:           faculty.name,
    fromDate,
    toDate,
    leaveDuration,
    approvalScore,
    recommendation,
    conflicts,
    affectedClassesCount:  affectedClasses.length,
    affectedClasses,
    suggestedSubstitutes:  suggestedSubstitutesResult,
  };
};
