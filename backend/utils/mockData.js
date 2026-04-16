import crypto from 'crypto';

const HASH_SALT = process.env.PASSWORD_SALT || 'iflo_local_salt_2026';
const hash = (password) => crypto.scryptSync(password, HASH_SALT, 64).toString('hex');

// ─── In-Memory Mock Data ─────────────────────────────────────────────────────
// Used when PostgreSQL is not connected (demo / hackathon mode)

export const departments = [
  { id: 1, name: 'Computer Science', hod_id: 9 },
  { id: 2, name: 'Mathematics', hod_id: 10 },
  { id: 3, name: 'Electronics', hod_id: 11 },
  { id: 4, name: 'Mechanical', hod_id: 12 },
];

export const users = [
  { id: 1, name: 'Dr. Arjun Mehta',    email: 'arjun@college.edu',  role: 'faculty', department_id: 1, skills: ['data structures', 'algorithms'], password: hash('password') },
  { id: 2, name: 'Prof. Sunita Rao',   email: 'sunita@college.edu', role: 'faculty', department_id: 1, skills: ['databases', 'system design'], password: hash('password') },
  { id: 3, name: 'Dr. Kiran Desai',    email: 'kiran@college.edu',  role: 'faculty', department_id: 2, skills: ['calculus', 'linear algebra'], password: hash('password') },
  { id: 4, name: 'Prof. Meena Iyer',   email: 'meena@college.edu',  role: 'faculty', department_id: 3, skills: ['digital electronics', 'signals'], password: hash('password') },
  { id: 5, name: 'Dr. Rajan Pillai',   email: 'rajan@college.edu',  role: 'faculty', department_id: 1, skills: ['algorithms', 'operating systems'], password: hash('password') },
  { id: 6, name: 'Prof. Divya Nair',   email: 'divya@college.edu',  role: 'faculty', department_id: 2, skills: ['probability', 'calculus'], password: hash('password') },
  { id: 7, name: 'Dr. Sanjay Gupta',   email: 'sanjay@college.edu', role: 'faculty', department_id: 4, skills: ['thermodynamics', 'fluid mechanics'], password: hash('password') },
  { id: 8, name: 'Prof. Priya Kumar',  email: 'priya@college.edu',  role: 'faculty', department_id: 1, skills: ['operating systems', 'computer networks'], password: hash('password') },
  { id: 9, name: 'Dr. Nikhil Verma',   email: 'nikhil@college.edu', role: 'hod',     department_id: 1, skills: ['academic leadership'], password: hash('password') },
  { id: 10, name: 'Dr. Meera Joshi',    email: 'meera@college.edu',  role: 'hod',     department_id: 2, skills: ['academic leadership'], password: hash('password') },
  { id: 11, name: 'Dr. Rohit Sharma',   email: 'rohit@college.edu',  role: 'hod',     department_id: 3, skills: ['academic leadership'], password: hash('password') },
  { id: 12, name: 'Dr. Anjali Gupta',   email: 'anjali@college.edu',  role: 'hod',     department_id: 4, skills: ['academic leadership'], password: hash('password') },
];

export const timetable = [
  // Dr. Arjun Mehta (id:1) - CS faculty
  { id: 1,  faculty_id: 1, subject: 'Data Structures',       day: 'Monday',    start_time: '09:00', end_time: '10:00', class_id: 'CS-301' },
  { id: 2,  faculty_id: 1, subject: 'Data Structures',       day: 'Wednesday', start_time: '09:00', end_time: '10:00', class_id: 'CS-301' },
  { id: 3,  faculty_id: 1, subject: 'Algorithms',            day: 'Friday',    start_time: '11:00', end_time: '12:00', class_id: 'CS-401' },

  // Prof. Sunita Rao (id:2) - CS faculty
  { id: 4,  faculty_id: 2, subject: 'Database Systems',      day: 'Monday',    start_time: '10:00', end_time: '11:00', class_id: 'CS-302' },
  { id: 5,  faculty_id: 2, subject: 'Database Systems',      day: 'Thursday',  start_time: '10:00', end_time: '11:00', class_id: 'CS-302' },
  { id: 6,  faculty_id: 2, subject: 'Data Structures',       day: 'Tuesday',   start_time: '09:00', end_time: '10:00', class_id: 'CS-303' },

  // Dr. Kiran Desai (id:3) - Math faculty
  { id: 7,  faculty_id: 3, subject: 'Calculus',              day: 'Monday',    start_time: '11:00', end_time: '12:00', class_id: 'MA-101' },
  { id: 8,  faculty_id: 3, subject: 'Linear Algebra',        day: 'Wednesday', start_time: '14:00', end_time: '15:00', class_id: 'MA-201' },

  // Prof. Meena Iyer (id:4) - Electronics
  { id: 9,  faculty_id: 4, subject: 'Digital Electronics',   day: 'Tuesday',   start_time: '11:00', end_time: '12:00', class_id: 'EC-201' },
  { id: 10, faculty_id: 4, subject: 'Signals & Systems',     day: 'Thursday',  start_time: '14:00', end_time: '15:00', class_id: 'EC-301' },

  // Dr. Rajan Pillai (id:5) - CS faculty
  { id: 11, faculty_id: 5, subject: 'Algorithms',            day: 'Monday',    start_time: '14:00', end_time: '15:00', class_id: 'CS-402' },
  { id: 12, faculty_id: 5, subject: 'Data Structures',       day: 'Friday',    start_time: '09:00', end_time: '10:00', class_id: 'CS-304' },

  // Prof. Divya Nair (id:6) - Math faculty
  { id: 13, faculty_id: 6, subject: 'Probability',           day: 'Tuesday',   start_time: '14:00', end_time: '15:00', class_id: 'MA-301' },
  { id: 14, faculty_id: 6, subject: 'Calculus',              day: 'Thursday',  start_time: '09:00', end_time: '10:00', class_id: 'MA-102' },

  // Dr. Sanjay Gupta (id:7) - Mechanical
  { id: 15, faculty_id: 7, subject: 'Thermodynamics',        day: 'Monday',    start_time: '09:00', end_time: '10:00', class_id: 'ME-201' },
  { id: 16, faculty_id: 7, subject: 'Fluid Mechanics',       day: 'Wednesday', start_time: '11:00', end_time: '12:00', class_id: 'ME-301' },

  // Prof. Priya Kumar (id:8) - CS faculty
  { id: 17, faculty_id: 8, subject: 'Operating Systems',     day: 'Tuesday',   start_time: '10:00', end_time: '11:00', class_id: 'CS-305' },
  { id: 18, faculty_id: 8, subject: 'Computer Networks',     day: 'Friday',    start_time: '14:00', end_time: '15:00', class_id: 'CS-405' },
];

export let leaveRequests = [
  {
    id: 1,
    faculty_id: 1,
    department_id: 1,
    from_date: '2025-04-10',
    to_date: '2025-04-11',
    reason: 'Medical appointment',
    status: 'approved',
    impact_score: 4.2,
  },
  {
    id: 2,
    faculty_id: 2,
    department_id: 1,
    from_date: '2025-04-14',
    to_date: '2025-04-14',
    reason: 'Family function',
    status: 'pending',
    impact_score: 2.8,
  },
  {
    id: 3,
    faculty_id: 3,
    department_id: 2,
    from_date: '2025-04-17',
    to_date: '2025-04-18',
    reason: 'Conference',
    status: 'approved',
    impact_score: 3.5,
  },
];

export let substitutions = [
  {
    id: 1,
    leave_id: 1,
    original_faculty_id: 1,
    substitute_faculty_id: 5,
    class_id: 'CS-301',
    date: '2025-04-10',
    status: 'accepted',
  },
];

export let impactLogs = [
  {
    leave_id: 1,
    affected_classes: 2,
    unresolved_classes: 0,
    overload_score: 1.2,
  },
];

export const deptScores = [
  { department_id: 1, date: '2025-04-01', score: 87 },
  { department_id: 1, date: '2025-04-07', score: 91 },
  { department_id: 1, date: '2025-04-14', score: 78 },
  { department_id: 2, date: '2025-04-01', score: 95 },
  { department_id: 2, date: '2025-04-07', score: 88 },
  { department_id: 2, date: '2025-04-14', score: 92 },
  { department_id: 3, date: '2025-04-01', score: 72 },
  { department_id: 3, date: '2025-04-07', score: 80 },
  { department_id: 3, date: '2025-04-14', score: 85 },
  { department_id: 4, date: '2025-04-01', score: 68 },
  { department_id: 4, date: '2025-04-07', score: 74 },
  { department_id: 4, date: '2025-04-14', score: 70 },
];

// Helper: get next auto-increment id for a collection
export const nextId = (arr) => (arr.length ? Math.max(...arr.map((r) => r.id)) + 1 : 1);
