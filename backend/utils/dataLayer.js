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
  try {
    const { rows } = await pool.query(
      'SELECT * FROM departments ORDER BY id'
    );
    return rows;
  } catch (e) {
    console.error('[DB ERROR getDepartments]', e.message);
    throw e; // ❗ no fallback
  }
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = async () => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users ORDER BY id'
    );
    return rows;
  } catch (e) {
    console.error('[DB ERROR getUsers]', e.message);
    throw e; // ❗ no fallback
  }
};

export const getUserById = async (id) => {
  const numId = Number(id);

  if (!numId) {
    throw new Error('Invalid user ID');
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [numId]
    );
    return rows[0] || null;
  } catch (e) {
    console.error('[DB ERROR getUserById]', e.message);
    throw e; // ❗ no fallback
  }
};

export const getUserByEmail = async (email) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email');
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    return rows[0] || null;
  } catch (e) {
    console.error('[DB ERROR getUserByEmail]', e.message);
    throw e; // ❗ no fallback
  }
};

// Update user acting_role field
export const setUserActingRole = async (userId, actingRole) => {
  const numId = Number(userId);

  if (!numId) {
    throw new Error('Invalid user ID');
  }

  // Optional: validate role (recommended)
  const allowedRoles = [null, 'hod'];
  if (!allowedRoles.includes(actingRole)) {
    throw new Error('Invalid acting role');
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users 
       SET acting_role = $1 
       WHERE id = $2 
       RETURNING *`,
      [actingRole, numId]
    );

    return rows[0] || null;
  } catch (e) {
    console.error('[DB ERROR setUserActingRole]', e.message);
    throw e;
  }
};

// Increment leaves_taken by 1 for a user (called on leave approval)
export const incrementLeavesTaken = async (userId, from_date, to_date) => {
  const numId = Number(userId);

  if (!numId) {
    throw new Error('Invalid user ID');
  }

  if (!from_date || !to_date) {
    throw new Error('Invalid leave dates');
  }

  // ✅ Force correct parsing (NO timezone bugs)
  const start = new Date(from_date + "T00:00:00");
  const end = new Date(to_date + "T00:00:00");

  // ✅ Proper validation
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }

  // ✅ Correct comparison
  if (end.getTime() < start.getTime()) {
    throw new Error('Invalid date range');
  }

  // ✅ Inclusive days calculation
  const diffTime = end.getTime() - start.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET leaves_taken = COALESCE(leaves_taken, 0) + $2
       WHERE id = $1
       RETURNING *`,
      [numId, days]
    );

    return rows[0] || null;
  } catch (e) {
    console.error('[DB ERROR incrementLeavesTaken]', e.message);
    throw e;
  }
};

// ─── Timetable ────────────────────────────────────────────────────────────────
export const getTimetable = async () => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM timetable ORDER BY id'
    );
    return rows;
  } catch (e) {
    console.error('[DB ERROR getTimetable]', e.message);
    throw e; // ❗ no fallback
  }
};

export const getTimetableByFaculty = async (facultyId) => {
  const numId = Number(facultyId);

  if (!numId) {
    throw new Error('Invalid faculty ID');
  }

  try {
    const { rows } = await pool.query(
      `SELECT * 
       FROM timetable 
       WHERE faculty_id = $1
       ORDER BY day, start_time`,
      [numId]
    );
    return rows;
  } catch (e) {
    console.error('[DB ERROR getTimetableByFaculty]', e.message);
    throw e; // ❗ no fallback
  }
};

// ─── Leave Requests ───────────────────────────────────────────────────────────
export const getLeaveRequests = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT 
          lr.*, 
          u.name AS faculty_name
       FROM leave_requests lr
       JOIN users u ON u.id = lr.faculty_id
       ORDER BY lr.id DESC`
    );

    return rows.map(normalizeLeaveRow);
  } catch (e) {
    console.error('[DB ERROR getLeaveRequests]', e.message);
    throw e; // ❗ no fallback
  }
};

export const getLeaveById = async (id) => {
  const numId = Number(id);

  if (!numId) {
    throw new Error('Invalid leave ID');
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
          lr.*, 
          u.name AS faculty_name
       FROM leave_requests lr
       JOIN users u ON u.id = lr.faculty_id
       WHERE lr.id = $1`,
      [numId]
    );

    return rows[0] ? normalizeLeaveRow(rows[0]) : null;
  } catch (e) {
    console.error('[DB ERROR getLeaveById]', e.message);
    throw e; // ❗ no fallback
  }
};

export const createLeaveRequest = async ({
  faculty_id,
  from_date,
  to_date,
  reason,
  impact_score = 0,
  is_hod_leave = false,
  acting_hod_id = null,
  status_override = null
}) => {
  const facultyIdNum = Number(faculty_id);

  if (!facultyIdNum) {
    throw new Error('Invalid faculty ID');
  }

  if (!from_date || !to_date) {
    throw new Error('Leave dates required');
  }

  const start = new Date(from_date);
  const end = new Date(to_date);

  if (isNaN(start) || isNaN(end) || end < start) {
    throw new Error('Invalid date range');
  }

  const faculty = await getUserById(facultyIdNum);
  if (!faculty) {
    throw new Error('Faculty not found');
  }

  const department_id = faculty.department_id;
  const status = status_override || 'pending';

  try {
    const { rows } = await pool.query(
      `INSERT INTO leave_requests 
        (faculty_id, department_id, from_date, to_date, reason, status, impact_score, is_hod_leave, acting_hod_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        facultyIdNum,
        department_id,
        from_date,
        to_date,
        reason,
        status,
        impact_score,
        is_hod_leave,
        acting_hod_id ? Number(acting_hod_id) : null
      ]
    );

    return normalizeLeaveRow(rows[0]);
  } catch (e) {
    console.error('[DB ERROR createLeaveRequest]', e.message);
    throw e;
  }
};

export const updateLeaveStatus = async (id, status) => {
  const numId = Number(id);

  if (!numId) {
    throw new Error('Invalid leave ID');
  }

  const allowedStatuses = ['pending', 'approved', 'rejected'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid status value');
  }

  try {
    const { rows } = await pool.query(
      `UPDATE leave_requests 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, numId]
    );

    return rows[0] ? normalizeLeaveRow(rows[0]) : null;
  } catch (e) {
    console.error('[DB ERROR updateLeaveStatus]', e.message);
    throw e;
  }
};

// ─── Dept Scores ──────────────────────────────────────────────────────────────
export const getDeptScores = async () => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM dept_scores ORDER BY date DESC'
    );

    return rows.map((r) => ({
      ...r,
      date: r.date instanceof Date
        ? r.date.toISOString().split('T')[0]
        : String(r.date),
    }));
  } catch (e) {
    console.error('[DB ERROR getDeptScores]', e.message);
    throw e; // ❗ no fallback
  }
};

export const getLeavesByFaculty = async (facultyId) => {
  const numId = Number(facultyId);

  if (!numId) {
    throw new Error('Invalid faculty ID');
  }

  try {
    const { rows } = await pool.query(
      `SELECT * 
       FROM leave_requests 
       WHERE faculty_id = $1 
       ORDER BY id DESC`,
      [numId]
    );

    return rows.map(normalizeLeaveRow);
  } catch (e) {
    console.error('[DB ERROR getLeavesByFaculty]', e.message);
    throw e; // ❗ no fallback
  }
};

export const getLeavesByDepartment = async (departmentId) => {
  const numId = Number(departmentId);

  if (!numId) {
    throw new Error('Invalid department ID');
  }

  try {
    const { rows } = await pool.query(
      `SELECT * 
       FROM leave_requests 
       WHERE department_id = $1 
       ORDER BY id DESC`,
      [numId]
    );

    return rows.map(normalizeLeaveRow);
  } catch (e) {
    console.error('[DB ERROR getLeavesByDepartment]', e.message);
    throw e; // ❗ no fallback
  }
};

// ─── Substitutions ────────────────────────────────────────────────────────────
export const getSubstitutionsByFaculty = async (facultyId) => {
  const numId = Number(facultyId);

  if (!numId) {
    throw new Error('Invalid faculty ID');
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
          s.*,
          o.name AS original_name,
          u.name AS substitute_name
       FROM substitutions s
       JOIN users o ON o.id = s.original_faculty_id
       JOIN users u ON u.id = s.substitute_faculty_id
       WHERE s.substitute_faculty_id = $1
       ORDER BY s.id DESC`,
      [numId]
    );

    return rows.map((row) => ({
      ...row,
      originalFaculty: {
        id: row.original_faculty_id,
        name: row.original_name,
      },
      substituteName: row.substitute_name,
    }));
  } catch (e) {
    console.error('[DB ERROR getSubstitutionsByFaculty]', e.message);
    throw e; // ❗ no fallback
  }
};

// Extra classes = accepted substitutions for a faculty (TEMPORARY, not in timetable)
export const getExtraClassesByFaculty = async (facultyId) => {
  const numId = Number(facultyId);

  if (!numId) {
    throw new Error('Invalid faculty ID');
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
          s.*,
          o.name AS original_name
       FROM substitutions s
       JOIN users o ON o.id = s.original_faculty_id
       WHERE s.substitute_faculty_id = $1 
         AND s.status = 'accepted'
       ORDER BY s.date DESC, s.start_time`,
      [numId]
    );

    return rows.map((row) => ({
      ...row,
      originalFaculty: {
        id: row.original_faculty_id,
        name: row.original_name,
      },
    }));
  } catch (e) {
    console.error('[DB ERROR getExtraClassesByFaculty]', e.message);
    throw e; // ❗ no fallback
  }
};

// Substitutions for a given leave (for HOD feedback loop)
export const getSubstitutionsByLeave = async (leaveId) => {
  const numId = Number(leaveId);

  if (!numId) {
    throw new Error('Invalid leave ID');
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
          s.*,
          u.name AS substitute_name
       FROM substitutions s
       JOIN users u ON u.id = s.substitute_faculty_id
       WHERE s.leave_id = $1
       ORDER BY s.id DESC`,
      [numId]
    );

    return rows.map((row) => ({
      ...row,
      substituteName: row.substitute_name,
    }));
  } catch (e) {
    console.error('[DB ERROR getSubstitutionsByLeave]', e.message);
    throw e; // ❗ no fallback
  }
};

export const getSubstitutionById = async (id) => {
  const numId = Number(id);

  if (!numId) {
    throw new Error('Invalid substitution ID');
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM substitutions WHERE id = $1',
      [numId]
    );

    return rows[0] || null;
  } catch (e) {
    console.error('[DB ERROR getSubstitutionById]', e.message);
    throw e; // ❗ no fallback
  }
};

export const createSubstitution = async ({
  leave_id,
  original_faculty_id,
  substitute_faculty_id,
  class_id,
  subject = '',
  day = '',
  start_time = '',
  end_time = '',
  date,
  status = 'assigned'
}) => {
  const leaveIdNum = Number(leave_id);
  const originalIdNum = Number(original_faculty_id);
  const substituteIdNum = Number(substitute_faculty_id);

  if (!leaveIdNum || !originalIdNum || !substituteIdNum) {
    throw new Error('Invalid IDs for substitution');
  }

  if (!date) {
    throw new Error('Date is required for substitution');
  }

  const allowedStatuses = ['assigned', 'accepted', 'rejected'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid substitution status');
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO substitutions 
        (leave_id, original_faculty_id, substitute_faculty_id, class_id, subject, day, start_time, end_time, date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        leaveIdNum,
        originalIdNum,
        substituteIdNum,
        class_id,
        subject,
        day,
        start_time,
        end_time,
        date,
        status
      ]
    );

    return rows[0];
  } catch (e) {
    console.error('[DB ERROR createSubstitution]', e.message);
    throw e;
  }
};

export const updateSubstitutionStatus = async (id, status) => {
  const numId = Number(id);

  if (!numId) {
    throw new Error('Invalid substitution ID');
  }

  const allowedStatuses = ['assigned', 'accepted', 'rejected'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid substitution status');
  }

  try {
    const { rows } = await pool.query(
      `UPDATE substitutions 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, numId]
    );

    return rows[0] || null;
  } catch (e) {
    console.error('[DB ERROR updateSubstitutionStatus]', e.message);
    throw e;
  }
};

export const getDepartmentById = async (departmentId) => {
  const numId = Number(departmentId);

  if (!numId) {
    throw new Error('Invalid department ID');
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM departments WHERE id = $1',
      [numId]
    );

    return rows[0] || null;
  } catch (e) {
    console.error('[DB ERROR getDepartmentById]', e.message);
    throw e; // ❗ no fallback
  }
};

export const getUsersByDepartment = async (departmentId) => {
  const numId = Number(departmentId);

  if (!numId) {
    throw new Error('Invalid department ID');
  }

  try {
    const { rows } = await pool.query(
      `SELECT * 
       FROM users 
       WHERE department_id = $1 
       ORDER BY id`,
      [numId]
    );

    return rows;
  } catch (e) {
    console.error('[DB ERROR getUsersByDepartment]', e.message);
    throw e; // ❗ no fallback
  }
};

// ─── Acting HOD Assignments ───────────────────────────────────────────────────

export const getActingHodAssignment = async (departmentId) => {
  const numId = Number(departmentId);

  if (!numId) {
    throw new Error('Invalid department ID');
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
          a.*,
          o.name AS hod_name,
          u.name AS acting_hod_name
       FROM acting_hod_assignments a
       JOIN users o ON o.id = a.original_hod_id
       JOIN users u ON u.id = a.acting_hod_id
       WHERE a.department_id = $1 
         AND a.active = true
       ORDER BY a.id DESC 
       LIMIT 1`,
      [numId]
    );

    return rows[0] || null;
  } catch (e) {
    console.error('[DB ERROR getActingHodAssignment]', e.message);
    throw e; // ❗ no fallback
  }
};

export const createActingHodAssignment = async ({
  department_id,
  original_hod_id,
  acting_hod_id,
  from_date,
  to_date
}) => {
  const deptId = Number(department_id);
  const originalId = Number(original_hod_id);
  const actingId = Number(acting_hod_id);

  if (!deptId || !originalId || !actingId) {
    throw new Error('Invalid IDs for acting HOD assignment');
  }

  if (!from_date || !to_date) {
    throw new Error('from_date and to_date are required');
  }

  const start = new Date(from_date);
  const end = new Date(to_date);

  if (isNaN(start) || isNaN(end) || end < start) {
    throw new Error('Invalid date range');
  }

  if (originalId === actingId) {
    throw new Error('Acting HOD cannot be same as original HOD');
  }

  try {
    // 🔴 Step 1: deactivate existing active assignment (VERY IMPORTANT)
    await pool.query(
      `UPDATE acting_hod_assignments
       SET active = false
       WHERE department_id = $1 AND active = true`,
      [deptId]
    );

    // 🟢 Step 2: create new acting HOD
    const { rows } = await pool.query(
      `INSERT INTO acting_hod_assignments
        (department_id, original_hod_id, acting_hod_id, from_date, to_date, active)
       VALUES ($1,$2,$3,$4,$5,true)
       RETURNING *`,
      [deptId, originalId, actingId, from_date, to_date]
    );

    return rows[0];
  } catch (e) {
    console.error('[DB ERROR createActingHodAssignment]', e.message);
    throw e;
  }
};

export const deactivateActingHodAssignment = async (id) => {
  const numId = Number(id);

  if (!numId) {
    throw new Error('Invalid acting HOD assignment ID');
  }

  try {
    const { rows } = await pool.query(
      `UPDATE acting_hod_assignments 
       SET active = false 
       WHERE id = $1 
       RETURNING *`,
      [numId]
    );

    return rows[0] || null;
  } catch (e) {
    console.error('[DB ERROR deactivateActingHodAssignment]', e.message);
    throw e;
  }
};

// Get ALL active acting HOD assignments (used by revert logic)
export const getActiveActingHodAssignments = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM acting_hod_assignments
       WHERE active = true
       ORDER BY id DESC`
    );

    return rows;
  } catch (e) {
    console.error('[DB ERROR getActiveActingHodAssignments]', e.message);
    throw e;
  }
};
