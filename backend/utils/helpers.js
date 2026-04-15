// ─── Shared helpers ───────────────────────────────────────────────────────────
// These are pure-function utilities that work on data arrays.
// Async wrappers call the dataLayer for all DB/mock reads.

import { getLeaveRequests, getTimetable, getUsers } from './dataLayer.js';

// ── getDaysBetween ────────────────────────────────────────────────────────────
// Returns array of weekday names (Mon–Fri) between two ISO date strings.
export const getDaysBetween = (fromDate, toDate) => {
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const days = [];
  for (
    let d = new Date(fromDate);
    d <= new Date(toDate);
    d.setDate(d.getDate() + 1)
  ) {
    const name = dayNames[d.getDay()];
    if (name !== 'Sunday' && name !== 'Saturday') days.push(name);
  }
  return days;
};

// ── getAffectedClasses ────────────────────────────────────────────────────────
export const getAffectedClasses = async (facultyId, fromDate, toDate) => {
  const allSlots = await getTimetable();
  const leaveDays = getDaysBetween(fromDate, toDate);
  return allSlots.filter(
    (s) => s.faculty_id === Number(facultyId) && leaveDays.includes(s.day)
  );
};

// ── getFacultyCurrentLoad ─────────────────────────────────────────────────────
export const getFacultyCurrentLoad = async (facultyId) => {
  const allSlots = await getTimetable();
  return allSlots.filter((s) => s.faculty_id === Number(facultyId)).length;
};

// ── isFacultyAvailable ────────────────────────────────────────────────────────
export const isFacultyAvailable = async (facultyId, fromDate, toDate) => {
  const allLeaves = await getLeaveRequests();
  const hasConflict = allLeaves.some(
    (r) =>
      r.faculty_id === Number(facultyId) &&
      ['approved', 'pending'].includes(r.status) &&
      r.from_date <= toDate &&
      r.to_date   >= fromDate
  );
  return !hasConflict;
};

// ── getMaxLoad ────────────────────────────────────────────────────────────────
export const getMaxLoad = async () => {
  const allSlots = await getTimetable();
  const allUsers = await getUsers();
  const loads = allUsers
    .filter((u) => u.role === 'faculty')
    .map((u) => allSlots.filter((s) => s.faculty_id === u.id).length);
  return Math.max(...loads, 1);
};
