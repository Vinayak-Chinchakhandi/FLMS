// ─── DB-aware Data Access Layer ──────────────────────────────────────────────
// Checks usingMockData at CALL TIME (not module load time) to handle the
// async DB connection race condition correctly.

import pool from '../db.js';
import * as mock from './mockData.js';
import { usingMockData } from '../db.js';

const useDB = () => !usingMockData;

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

// Update user acting_role field
export const setUserActingRole = async (userId, actingRole) => {
  const numId = Number(userId);
  if (!useDB()) {
    const user = mock.users.find((u) => u.id === numId);
    if (user) user.acting_role = actingRole;
    return user || null;
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET acting_role = $1 WHERE id = $2 RETURNING *',
      [actingRole, numId]
    );
    return rows[0] || null;
  } catch (e) {
    console.warn('[dataLayer] setUserActingRole DB error, using mock:', e.message);
    const user = mock.users.find((u) => u.id === numId);
    if (user) user.acting_role = actingRole;
    return user || null;
  }
};

// Increment leaves_taken by 1 for a user (called on leave approval)
export const incrementLeavesTaken = async (userId) => {
  const numId = Number(userId);
  if (!useDB()) {
    const user = mock.users.find((u) => u.id === numId);
    if (user) user.leaves_taken = (user.leaves_taken || 0) + 1;
    return user || null;
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET leaves_taken = COALESCE(leaves_taken, 0) + 1 WHERE id = $1 RETURNING *',
      [numId]
    );
    return rows[0] || null;
  } catch (e) {
    console.warn('[dataLayer] incrementLeavesTaken DB error, using mock:', e.message);
    const user = mock.users.find((u) => u.id === numId);
    if (user) user.leaves_taken = (user.leaves_taken || 0) + 1;
    return user || null;
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

export const createLeaveRequest = async ({ faculty_id, from_date, to_date, reason, impact_score = 0, is_hod_leave = false, acting_hod_id = null, status_override = null }) => {
  const faculty = await getUserById(Number(faculty_id));
  const department_id = faculty ? faculty.department_id : null;
  const status = status_override || 'pending';

  if (!useDB()) {
    const rec = {
      id: mock.nextId(mock.leaveRequests),
      faculty_id: Number(faculty_id),
      department_id,
      from_date,
      to_date,
      reason,
      status,
      impact_score,
      is_hod_leave,
      acting_hod_id: acting_hod_id ? Number(acting_hod_id) : null,
    };
    mock.leaveRequests.push(rec);
    return rec;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO leave_requests (faculty_id, department_id, from_date, to_date, reason, status, impact_score, is_hod_leave, acting_hod_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [faculty_id, department_id, from_date, to_date, reason, status, impact_score, is_hod_leave, acting_hod_id]
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
      status,
      impact_score,
      is_hod_leave,
      acting_hod_id: acting_hod_id ? Number(acting_hod_id) : null,
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

// ─── Substitutions ────────────────────────────────────────────────────────────
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

// Extra classes = accepted substitutions for a faculty (TEMPORARY, not in timetable)
export const getExtraClassesByFaculty = async (facultyId) => {
  const numId = Number(facultyId);
  if (!useDB()) {
    return mock.substitutions
      .filter((s) => Number(s.substitute_faculty_id) === numId && s.status === 'accepted')
      .map((s) => ({
        ...s,
        originalFaculty: mock.users.find((u) => u.id === s.original_faculty_id) || null,
      }));
  }
  try {
    const { rows } = await pool.query(
      `SELECT s.*, o.name AS original_name
         FROM substitutions s
         JOIN users o ON o.id = s.original_faculty_id
        WHERE s.substitute_faculty_id = $1 AND s.status = 'accepted'
        ORDER BY s.id DESC`,
      [numId]
    );
    return rows.map((row) => ({
      ...row,
      originalFaculty: { id: row.original_faculty_id, name: row.original_name },
    }));
  } catch (e) {
    console.warn('[dataLayer] getExtraClassesByFaculty DB error, using mock:', e.message);
    return mock.substitutions
      .filter((s) => Number(s.substitute_faculty_id) === numId && s.status === 'accepted')
      .map((s) => ({
        ...s,
        originalFaculty: mock.users.find((u) => u.id === s.original_faculty_id) || null,
      }));
  }
};

// Substitutions for a given leave (for HOD feedback loop)
export const getSubstitutionsByLeave = async (leaveId) => {
  const numId = Number(leaveId);
  if (!useDB()) {
    return mock.substitutions
      .filter((s) => Number(s.leave_id) === numId)
      .map((s) => ({
        ...s,
        substituteName: (mock.users.find((u) => u.id === s.substitute_faculty_id) || {}).name || 'Unknown',
      }));
  }
  try {
    const { rows } = await pool.query(
      `SELECT s.*, u.name AS substitute_name
         FROM substitutions s
         JOIN users u ON u.id = s.substitute_faculty_id
        WHERE s.leave_id = $1`,
      [numId]
    );
    return rows.map((row) => ({ ...row, substituteName: row.substitute_name }));
  } catch (e) {
    console.warn('[dataLayer] getSubstitutionsByLeave DB error, using mock:', e.message);
    return mock.substitutions
      .filter((s) => Number(s.leave_id) === numId)
      .map((s) => ({
        ...s,
        substituteName: (mock.users.find((u) => u.id === s.substitute_faculty_id) || {}).name || 'Unknown',
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

export const createSubstitution = async ({
  leave_id, original_faculty_id, substitute_faculty_id,
  class_id, subject = '', day = '', start_time = '', end_time = '', date, status = 'assigned'
}) => {
  if (!useDB()) {
    const rec = {
      id: mock.nextId(mock.substitutions),
      leave_id: Number(leave_id),
      original_faculty_id: Number(original_faculty_id),
      substitute_faculty_id: Number(substitute_faculty_id),
      class_id,
      subject,
      day,
      start_time,
      end_time,
      date,
      status,
    };
    mock.substitutions.push(rec);
    return rec;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO substitutions (leave_id, original_faculty_id, substitute_faculty_id, class_id, subject, day, start_time, end_time, date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [leave_id, original_faculty_id, substitute_faculty_id, class_id, subject, day, start_time, end_time, date, status]
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
      subject,
      day,
      start_time,
      end_time,
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

// ─── Acting HOD Assignments ───────────────────────────────────────────────────

export const getActingHodAssignment = async (departmentId) => {
  const numId = Number(departmentId);
  if (!useDB()) {
    return mock.actingHodAssignments.find((a) => a.department_id === numId && a.active) || null;
  }
  try {
    const { rows } = await pool.query(
      `SELECT a.*, o.name AS hod_name, u.name AS acting_hod_name
         FROM acting_hod_assignments a
         JOIN users o ON o.id = a.original_hod_id
         JOIN users u ON u.id = a.acting_hod_id
        WHERE a.department_id = $1 AND a.active = true
        ORDER BY a.id DESC LIMIT 1`,
      [numId]
    );
    return rows[0] || null;
  } catch (e) {
    console.warn('[dataLayer] getActingHodAssignment DB error, using mock:', e.message);
    return mock.actingHodAssignments.find((a) => a.department_id === numId && a.active) || null;
  }
};

export const createActingHodAssignment = async ({ department_id, original_hod_id, acting_hod_id, from_date, to_date }) => {
  if (!useDB()) {
    const rec = {
      id: mock.nextId(mock.actingHodAssignments),
      department_id: Number(department_id),
      original_hod_id: Number(original_hod_id),
      acting_hod_id: Number(acting_hod_id),
      from_date,
      to_date,
      active: true,
    };
    mock.actingHodAssignments.push(rec);
    return rec;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO acting_hod_assignments (department_id, original_hod_id, acting_hod_id, from_date, to_date, active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [department_id, original_hod_id, acting_hod_id, from_date, to_date]
    );
    return rows[0];
  } catch (e) {
    console.warn('[dataLayer] createActingHodAssignment DB error, using mock:', e.message);
    const rec = {
      id: mock.nextId(mock.actingHodAssignments),
      department_id: Number(department_id),
      original_hod_id: Number(original_hod_id),
      acting_hod_id: Number(acting_hod_id),
      from_date,
      to_date,
      active: true,
    };
    mock.actingHodAssignments.push(rec);
    return rec;
  }
};

export const deactivateActingHodAssignment = async (id) => {
  const numId = Number(id);
  if (!useDB()) {
    const rec = mock.actingHodAssignments.find((a) => a.id === numId);
    if (rec) rec.active = false;
    return rec || null;
  }
  try {
    const { rows } = await pool.query(
      'UPDATE acting_hod_assignments SET active = false WHERE id = $1 RETURNING *',
      [numId]
    );
    return rows[0] || null;
  } catch (e) {
    console.warn('[dataLayer] deactivateActingHodAssignment DB error, using mock:', e.message);
    const rec = mock.actingHodAssignments.find((a) => a.id === numId);
    if (rec) rec.active = false;
    return rec || null;
  }
};

// Get ALL active acting HOD assignments (used by revert logic)
export const getActiveActingHodAssignments = async () => {
  if (!useDB()) {
    return mock.actingHodAssignments.filter((a) => a.active);
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM acting_hod_assignments WHERE active = true'
    );
    return rows;
  } catch (e) {
    console.warn('[dataLayer] getActiveActingHodAssignments DB error, using mock:', e.message);
    return mock.actingHodAssignments.filter((a) => a.active);
  }
};
