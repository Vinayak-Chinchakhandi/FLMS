// ─── DB-aware Data Access Layer ──────────────────────────────────────────────
// Checks usingMockData at CALL TIME (not module load time) to handle the
// async DB connection race condition correctly.

import pool, { usingMockData } from '../db.js';
import * as mock from './mockData.js';

// Helper: safe check at call-time (pool may become null after failed ping)
const useDB = () => !usingMockData && pool !== null;

// ─── Departments ──────────────────────────────────────────────────────────────
export const getDepartments = async () => {
  if (!useDB()) return [...mock.departments];
  try {
    const { rows } = await pool.query('SELECT * FROM departments ORDER BY id');
    return rows;
  } catch (e) {
    console.warn('[dataLayer] getDepartments DB error, using mock:', e.message);
    return [...mock.departments];
  }
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = async () => {
  if (!useDB()) return [...mock.users];
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
    return rows;
  } catch (e) {
    console.warn('[dataLayer] getUsers DB error, using mock:', e.message);
    return [...mock.users];
  }
};

export const getUserById = async (id) => {
  const numId = Number(id);
  if (!useDB()) return mock.users.find((u) => u.id === numId) || null;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [numId]);
    return rows[0] || null;
  } catch (e) {
    console.warn('[dataLayer] getUserById DB error, using mock:', e.message);
    return mock.users.find((u) => u.id === numId) || null;
  }
};

// ─── Timetable ────────────────────────────────────────────────────────────────
export const getTimetable = async () => {
  if (!useDB()) return [...mock.timetable];
  try {
    const { rows } = await pool.query('SELECT * FROM timetable ORDER BY id');
    return rows;
  } catch (e) {
    console.warn('[dataLayer] getTimetable DB error, using mock:', e.message);
    return [...mock.timetable];
  }
};

export const getTimetableByFaculty = async (facultyId) => {
  const numId = Number(facultyId);
  if (!useDB()) return mock.timetable.filter((t) => t.faculty_id === numId);
  try {
    const { rows } = await pool.query(
      'SELECT * FROM timetable WHERE faculty_id = $1', [numId]
    );
    return rows;
  } catch (e) {
    console.warn('[dataLayer] getTimetableByFaculty DB error, using mock:', e.message);
    return mock.timetable.filter((t) => t.faculty_id === numId);
  }
};

// ─── Leave Requests ───────────────────────────────────────────────────────────
export const getLeaveRequests = async () => {
  if (!useDB()) return [...mock.leaveRequests];
  try {
    const { rows } = await pool.query(
      `SELECT lr.*, u.name AS faculty_name
         FROM leave_requests lr
         JOIN users u ON u.id = lr.faculty_id
        ORDER BY lr.id DESC`
    );
    // Normalize date fields from DB Date objects → ISO strings
    return rows.map(normalizeLeaveRow);
  } catch (e) {
    console.warn('[dataLayer] getLeaveRequests DB error, using mock:', e.message);
    return [...mock.leaveRequests];
  }
};

export const getLeaveById = async (id) => {
  const numId = Number(id);
  if (!useDB()) return mock.leaveRequests.find((r) => r.id === numId) || null;
  try {
    const { rows } = await pool.query(
      `SELECT lr.*, u.name AS faculty_name
         FROM leave_requests lr
         JOIN users u ON u.id = lr.faculty_id
        WHERE lr.id = $1`,
      [numId]
    );
    return rows[0] ? normalizeLeaveRow(rows[0]) : null;
  } catch (e) {
    console.warn('[dataLayer] getLeaveById DB error, using mock:', e.message);
    return mock.leaveRequests.find((r) => r.id === numId) || null;
  }
};

export const createLeaveRequest = async ({ faculty_id, from_date, to_date, reason, impact_score = 0 }) => {
  if (!useDB()) {
    const rec = {
      id: mock.nextId(mock.leaveRequests),
      faculty_id: Number(faculty_id),
      from_date, to_date, reason,
      status: 'pending',
      impact_score,
    };
    mock.leaveRequests.push(rec);
    return rec;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO leave_requests (faculty_id, from_date, to_date, reason, status, impact_score)
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
      [faculty_id, from_date, to_date, reason, impact_score]
    );
    return normalizeLeaveRow(rows[0]);
  } catch (e) {
    console.warn('[dataLayer] createLeaveRequest DB error, using mock:', e.message);
    const rec = {
      id: mock.nextId(mock.leaveRequests),
      faculty_id: Number(faculty_id),
      from_date, to_date, reason,
      status: 'pending',
      impact_score,
    };
    mock.leaveRequests.push(rec);
    return rec;
  }
};

export const updateLeaveStatus = async (id, status) => {
  const numId = Number(id);
  if (!useDB()) {
    const rec = mock.leaveRequests.find((r) => r.id === numId);
    if (!rec) return null;
    rec.status = status;
    return rec;
  }
  try {
    const { rows } = await pool.query(
      `UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *`,
      [status, numId]
    );
    return rows[0] ? normalizeLeaveRow(rows[0]) : null;
  } catch (e) {
    console.warn('[dataLayer] updateLeaveStatus DB error, using mock:', e.message);
    const rec = mock.leaveRequests.find((r) => r.id === numId);
    if (!rec) return null;
    rec.status = status;
    return rec;
  }
};

// ─── Dept Scores ──────────────────────────────────────────────────────────────
export const getDeptScores = async () => {
  if (!useDB()) return [...mock.deptScores];
  try {
    const { rows } = await pool.query('SELECT * FROM dept_scores ORDER BY date DESC');
    return rows.map((r) => ({
      ...r,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
    }));
  } catch (e) {
    console.warn('[dataLayer] getDeptScores DB error, using mock:', e.message);
    return [...mock.deptScores];
  }
};

// ─── Internal normalizer ──────────────────────────────────────────────────────
// pg returns DATE columns as JS Date objects. Convert to 'YYYY-MM-DD' strings
// so string comparisons in helpers work correctly in both mock and DB mode.
function normalizeLeaveRow(row) {
  return {
    ...row,
    from_date: row.from_date instanceof Date
      ? row.from_date.toISOString().split('T')[0]
      : String(row.from_date),
    to_date: row.to_date instanceof Date
      ? row.to_date.toISOString().split('T')[0]
      : String(row.to_date),
  };
}
