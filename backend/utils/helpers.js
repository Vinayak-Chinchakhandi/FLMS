// ─── Shared helpers ───────────────────────────────────────────────────────────

import { getLeaveRequests, getTimetable, getUsers } from './dataLayer.js';

// ── getDaysBetween ────────────────────────────────────────────────────────────
// Returns array of weekday names (Mon-Fri) between two ISO date strings.
export const getDaysBetween = (fromDate, toDate) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const days = [];
  const start = new Date(fromDate);
  const end   = new Date(toDate);

  if (isNaN(start) || isNaN(end)) return [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const name = dayNames[d.getDay()];
    if (name !== 'Sunday' && name !== 'Saturday') days.push(name);
  }
  return days;
};

// ── toDateStr ─────────────────────────────────────────────────────────────────
// Normalize any date value to 'YYYY-MM-DD' string for safe comparisons.
const toDateStr = (val) => {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).split('T')[0];
};

// ── getAffectedClasses ────────────────────────────────────────────────────────
export const getAffectedClasses = async (facultyId, fromDate, toDate) => {
  const allSlots  = await getTimetable();
  const leaveDays = getDaysBetween(fromDate, toDate);
  return allSlots.filter(
    (s) => Number(s.faculty_id) === Number(facultyId) && leaveDays.includes(s.day)
  );
};

// ── getFacultyCurrentLoad ─────────────────────────────────────────────────────
export const getFacultyCurrentLoad = async (facultyId) => {
  const allSlots = await getTimetable();
  return allSlots.filter((s) => Number(s.faculty_id) === Number(facultyId)).length;
};

// ── isFacultyAvailable ────────────────────────────────────────────────────────
// BUG FIX: was doing string <= comparison which fails on Date objects from pg.
// Now normalizes both sides to 'YYYY-MM-DD' strings before comparing.
export const isFacultyAvailable = async (facultyId, fromDate, toDate) => {
  const allLeaves = await getLeaveRequests();
  const from = toDateStr(fromDate);
  const to   = toDateStr(toDate);

  const hasConflict = allLeaves.some((r) => {
    if (Number(r.faculty_id) !== Number(facultyId)) return false;
    if (!['approved', 'pending'].includes(r.status))  return false;
    const rFrom = toDateStr(r.from_date);
    const rTo   = toDateStr(r.to_date);
    return rFrom <= to && rTo >= from;
  });

  return !hasConflict;
};

// ── getMaxLoad ────────────────────────────────────────────────────────────────
export const getMaxLoad = async () => {
  const [allSlots, allUsers] = await Promise.all([getTimetable(), getUsers()]);
  const loads = allUsers
    .filter((u) => u.role === 'faculty')
    .map((u) => allSlots.filter((s) => Number(s.faculty_id) === u.id).length);
  return Math.max(...loads, 1);
};
