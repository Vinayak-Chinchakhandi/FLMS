// ─── DB-aware Data Access Layer ──────────────────────────────────────────────
// All queries fall back to mock data automatically when pool is null.
// This keeps every service/controller identical in mock AND real-DB modes.

import pool, { usingMockData } from '../db.js';
import * as mock from './mockData.js';

// ─── Departments ──────────────────────────────────────────────────────────────
export const getDepartments = async () => {
  if (usingMockData || !pool) return mock.departments;
  const { rows } = await pool.query('SELECT * FROM departments ORDER BY id');
  return rows;
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = async () => {
  if (usingMockData || !pool) return mock.users;
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
  return rows;
};

export const getUserById = async (id) => {
  if (usingMockData || !pool) return mock.users.find((u) => u.id === Number(id)) || null;
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
};

// ─── Timetable ────────────────────────────────────────────────────────────────
export const getTimetable = async () => {
  if (usingMockData || !pool) return mock.timetable;
  const { rows } = await pool.query('SELECT * FROM timetable ORDER BY id');
  return rows;
};

export const getTimetableByFaculty = async (facultyId) => {
  if (usingMockData || !pool) {
    return mock.timetable.filter((t) => t.faculty_id === Number(facultyId));
  }
  const { rows } = await pool.query(
    'SELECT * FROM timetable WHERE faculty_id = $1',
    [facultyId]
  );
  return rows;
};

// ─── Leave Requests ───────────────────────────────────────────────────────────
export const getLeaveRequests = async () => {
  if (usingMockData || !pool) return mock.leaveRequests;
  const { rows } = await pool.query(
    `SELECT lr.*, u.name AS faculty_name
       FROM leave_requests lr
       JOIN users u ON u.id = lr.faculty_id
      ORDER BY lr.id DESC`
  );
  return rows;
};

export const getLeaveById = async (id) => {
  if (usingMockData || !pool) return mock.leaveRequests.find((r) => r.id === Number(id)) || null;
  const { rows } = await pool.query(
    `SELECT lr.*, u.name AS faculty_name
       FROM leave_requests lr
       JOIN users u ON u.id = lr.faculty_id
      WHERE lr.id = $1`,
    [id]
  );
  return rows[0] || null;
};

export const createLeaveRequest = async ({ faculty_id, from_date, to_date, reason, impact_score = 0 }) => {
  if (usingMockData || !pool) {
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
  const { rows } = await pool.query(
    `INSERT INTO leave_requests (faculty_id, from_date, to_date, reason, status, impact_score)
     VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
    [faculty_id, from_date, to_date, reason, impact_score]
  );
  return rows[0];
};

export const updateLeaveStatus = async (id, status) => {
  if (usingMockData || !pool) {
    const rec = mock.leaveRequests.find((r) => r.id === Number(id));
    if (!rec) return null;
    rec.status = status;
    return rec;
  }
  const { rows } = await pool.query(
    `UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] || null;
};

// ─── Dept Scores ──────────────────────────────────────────────────────────────
export const getDeptScores = async () => {
  if (usingMockData || !pool) return mock.deptScores;
  const { rows } = await pool.query('SELECT * FROM dept_scores ORDER BY date DESC');
  return rows;
};
