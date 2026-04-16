// ─── DB-aware Data Access Layer ──────────────────────────────────────────────
// Checks usingMockData at CALL TIME (not module load time) to handle the
// async DB connection race condition correctly.

import pool from '../db.js';
import * as mock from './mockData.js';

// Helper: safe check at call-time (pool may become null after failed ping)
const useDB = () => pool !== null;
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

export const getUserByEmail = async (email) => {
  if (!useDB()) return mock.users.find((u) => u.email === email) || null;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  } catch (e) {
    console.warn('[dataLayer] getUserByEmail DB error, using mock:', e.message);
    return mock.users.find((u) => u.email === email) || null;
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
  const faculty = await getUserById(Number(faculty_id));
  const department_id = faculty ? faculty.department_id : null;

  if (!useDB()) {
    const rec = {
      id: mock.nextId(mock.leaveRequests),
      faculty_id: Number(faculty_id),
      department_id,
      from_date,
      to_date,
      reason,
      status: 'pending',
      impact_score,
    };
    mock.leaveRequests.push(rec);
    return rec;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO leave_requests (faculty_id, department_id, from_date, to_date, reason, status, impact_score)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *`,
      [faculty_id, department_id, from_date, to_date, reason, impact_score]
    );
    return normalizeLeaveRow(rows[0]);
  } catch (e) {
    console.warn('[dataLayer] createLeaveRequest DB error, using mock:', e.message);
    const rec = {
      id: mock.nextId(mock.leaveRequests),
      faculty_id: Number(faculty_id),
      department_id,
      from_date,
      to_date,
      reason,
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

export const getLeavesByFaculty = async (facultyId) => {
  const numId = Number(facultyId);
  if (!useDB()) return mock.leaveRequests.filter((r) => Number(r.faculty_id) === numId);
  try {
    const { rows } = await pool.query('SELECT * FROM leave_requests WHERE faculty_id = $1 ORDER BY id DESC', [numId]);
    return rows.map(normalizeLeaveRow);
  } catch (e) {
    console.warn('[dataLayer] getLeavesByFaculty DB error, using mock:', e.message);
    return mock.leaveRequests.filter((r) => Number(r.faculty_id) === numId);
  }
};

export const getLeavesByDepartment = async (departmentId) => {
  const numId = Number(departmentId);
  if (!useDB()) return mock.leaveRequests.filter((r) => Number(r.department_id) === numId);
  try {
    const { rows } = await pool.query('SELECT * FROM leave_requests WHERE department_id = $1 ORDER BY id DESC', [numId]);
    return rows.map(normalizeLeaveRow);
  } catch (e) {
    console.warn('[dataLayer] getLeavesByDepartment DB error, using mock:', e.message);
    return mock.leaveRequests.filter((r) => Number(r.department_id) === numId);
  }
};

export const getSubstitutionsByFaculty = async (facultyId) => {
  const numId = Number(facultyId);
  if (!useDB()) {
    return mock.substitutions
      .filter((s) => Number(s.substitute_faculty_id) === numId)
      .map((s) => ({
        ...s,
        originalFaculty: mock.users.find((u) => u.id === s.original_faculty_id) || null,
      }));
  }
  try {
    const { rows } = await pool.query(
      `SELECT s.*, o.name AS original_name, u.name AS substitute_name
         FROM substitutions s
         JOIN users o ON o.id = s.original_faculty_id
         JOIN users u ON u.id = s.substitute_faculty_id
        WHERE s.substitute_faculty_id = $1
        ORDER BY s.id DESC`,
      [numId]
    );
    return rows.map((row) => ({
      ...row,
      originalFaculty: { id: row.original_faculty_id, name: row.original_name },
      substituteName: row.substitute_name,
    }));
  } catch (e) {
    console.warn('[dataLayer] getSubstitutionsByFaculty DB error, using mock:', e.message);
    return mock.substitutions
      .filter((s) => Number(s.substitute_faculty_id) === numId)
      .map((s) => ({
        ...s,
        originalFaculty: mock.users.find((u) => u.id === s.original_faculty_id) || null,
      }));
  }
};

export const getSubstitutionById = async (id) => {
  const numId = Number(id);
  if (!useDB()) return mock.substitutions.find((s) => s.id === numId) || null;
  try {
    const { rows } = await pool.query('SELECT * FROM substitutions WHERE id = $1', [numId]);
    return rows[0] || null;
  } catch (e) {
    console.warn('[dataLayer] getSubstitutionById DB error, using mock:', e.message);
    return mock.substitutions.find((s) => s.id === numId) || null;
  }
};

export const createSubstitution = async ({ leave_id, original_faculty_id, substitute_faculty_id, class_id, date, status = 'assigned' }) => {
  if (!useDB()) {
    const rec = {
      id: mock.nextId(mock.substitutions),
      leave_id: Number(leave_id),
      original_faculty_id: Number(original_faculty_id),
      substitute_faculty_id: Number(substitute_faculty_id),
      class_id,
      date,
      status,
    };
    mock.substitutions.push(rec);
    return rec;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO substitutions (leave_id, original_faculty_id, substitute_faculty_id, class_id, date, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [leave_id, original_faculty_id, substitute_faculty_id, class_id, date, status]
    );
    return rows[0];
  } catch (e) {
    console.warn('[dataLayer] createSubstitution DB error, using mock:', e.message);
    const rec = {
      id: mock.nextId(mock.substitutions),
      leave_id: Number(leave_id),
      original_faculty_id: Number(original_faculty_id),
      substitute_faculty_id: Number(substitute_faculty_id),
      class_id,
      date,
      status,
    };
    mock.substitutions.push(rec);
    return rec;
  }
};

export const updateSubstitutionStatus = async (id, status) => {
  const numId = Number(id);
  if (!useDB()) {
    const rec = mock.substitutions.find((s) => s.id === numId);
    if (!rec) return null;
    rec.status = status;
    return rec;
  }
  try {
    const { rows } = await pool.query(
      'UPDATE substitutions SET status = $1 WHERE id = $2 RETURNING *',
      [status, numId]
    );
    return rows[0] || null;
  } catch (e) {
    console.warn('[dataLayer] updateSubstitutionStatus DB error, using mock:', e.message);
    const rec = mock.substitutions.find((s) => s.id === numId);
    if (!rec) return null;
    rec.status = status;
    return rec;
  }
};

export const getDepartmentById = async (departmentId) => {
  const numId = Number(departmentId);
  if (!useDB()) return mock.departments.find((d) => d.id === numId) || null;
  try {
    const { rows } = await pool.query('SELECT * FROM departments WHERE id = $1', [numId]);
    return rows[0] || null;
  } catch (e) {
    console.warn('[dataLayer] getDepartmentById DB error, using mock:', e.message);
    return mock.departments.find((d) => d.id === numId) || null;
  }
};

export const getUsersByDepartment = async (departmentId) => {
  const numId = Number(departmentId);
  if (!useDB()) return mock.users.filter((u) => Number(u.department_id) === numId);
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE department_id = $1 ORDER BY id', [numId]);
    return rows;
  } catch (e) {
    console.warn('[dataLayer] getUsersByDepartment DB error, using mock:', e.message);
    return mock.users.filter((u) => Number(u.department_id) === numId);
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
