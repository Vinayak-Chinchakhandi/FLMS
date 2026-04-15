// ─── Simulation Service ───────────────────────────────────────────────────────
// Impact Score = (affected_classes*0.5) + (unresolved*0.3) + (overload*0.2)

import { getAffectedClasses, getFacultyCurrentLoad, getMaxLoad } from '../utils/helpers.js';
import { suggestSubstitutes } from './substituteService.js';

export const runSimulation = async (facultyId, fromDate, toDate) => {
  const affectedClasses = await getAffectedClasses(facultyId, fromDate, toDate);
  const maxLoad         = await getMaxLoad();

  if (affectedClasses.length === 0) {
    return {
      facultyId, fromDate, toDate,
      affectedClasses:  [],
      substitutions:    [],
      overloadWarnings: [],
      impactScore:      0,
      resolvedCount:    0,
      unresolvedCount:  0,
      summary: 'No classes affected during this period.',
    };
  }

  const substitutions    = [];
  const overloadWarnings = [];
  let unresolvedCount    = 0;

  for (const cls of affectedClasses) {
    const candidates = await suggestSubstitutes(facultyId, [cls], fromDate, toDate);

    if (candidates.length === 0) {
      unresolvedCount++;
      substitutions.push({
        classId:         cls.class_id,
        subject:         cls.subject,
        day:             cls.day,
        timeSlot:        `${cls.start_time} – ${cls.end_time}`,
        status:          'UNRESOLVED',
        substitute:      null,
        substituteScore: null,
      });
      continue;
    }

    const best     = candidates[0];
    const newLoad  = (await getFacultyCurrentLoad(best.facultyId)) + 1;
    const overloadRatio = newLoad / maxLoad;

    if (overloadRatio > 0.85) {
      overloadWarnings.push({
        facultyId:   best.facultyId,
        facultyName: best.name,
        currentLoad: best.currentLoad,
        newLoad,
        message:     `${best.name} will be at ${Math.round(overloadRatio * 100)}% capacity after substitution`,
      });
    }

    substitutions.push({
      classId:         cls.class_id,
      subject:         cls.subject,
      day:             cls.day,
      timeSlot:        `${cls.start_time} – ${cls.end_time}`,
      status:          'ASSIGNED',
      substitute:      { id: best.facultyId, name: best.name, email: best.email },
      substituteScore: best.score,
    });
  }

  const overloadScore = overloadWarnings.length > 0
    ? overloadWarnings.reduce((s, w) => s + w.newLoad / maxLoad, 0) / overloadWarnings.length
    : 0;

  const impactScore =
    affectedClasses.length * 0.5 +
    unresolvedCount         * 0.3 +
    overloadScore           * 0.2;

  return {
    facultyId, fromDate, toDate,
    affectedClasses: affectedClasses.map((c) => ({
      classId:  c.class_id, subject: c.subject, day: c.day,
      timeSlot: `${c.start_time} – ${c.end_time}`,
    })),
    substitutions,
    overloadWarnings,
    impactScore:    parseFloat(impactScore.toFixed(2)),
    resolvedCount:  affectedClasses.length - unresolvedCount,
    unresolvedCount,
    summary: `${affectedClasses.length} class(es) affected. ${affectedClasses.length - unresolvedCount} resolved, ${unresolvedCount} unresolved.`,
  };
};
