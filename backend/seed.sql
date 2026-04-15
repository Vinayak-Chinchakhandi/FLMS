-- ─── IFLO Seed Data ──────────────────────────────────────────────────────────
-- Run AFTER schema.sql:
--   psql $DATABASE_URL -f seed.sql

-- Departments
INSERT INTO departments (id, name) VALUES
  (1, 'Computer Science'),
  (2, 'Mathematics'),
  (3, 'Electronics'),
  (4, 'Mechanical')
ON CONFLICT (id) DO NOTHING;

SELECT setval('departments_id_seq', 10);

-- Users
INSERT INTO users (id, name, email, role, department_id) VALUES
  (1,  'Dr. Arjun Mehta',   'arjun@college.edu',  'faculty', 1),
  (2,  'Prof. Sunita Rao',  'sunita@college.edu', 'faculty', 1),
  (3,  'Dr. Kiran Desai',   'kiran@college.edu',  'faculty', 2),
  (4,  'Prof. Meena Iyer',  'meena@college.edu',  'faculty', 3),
  (5,  'Dr. Rajan Pillai',  'rajan@college.edu',  'faculty', 1),
  (6,  'Prof. Divya Nair',  'divya@college.edu',  'faculty', 2),
  (7,  'Dr. Sanjay Gupta',  'sanjay@college.edu', 'faculty', 4),
  (8,  'Prof. Priya Kumar', 'priya@college.edu',  'faculty', 1),
  (9,  'Admin User',        'admin@college.edu',  'admin',   1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', 20);

-- Timetable
INSERT INTO timetable (id, faculty_id, subject, day, start_time, end_time, class_id) VALUES
  (1,  1, 'Data Structures',     'Monday',    '09:00', '10:00', 'CS-301'),
  (2,  1, 'Data Structures',     'Wednesday', '09:00', '10:00', 'CS-301'),
  (3,  1, 'Algorithms',          'Friday',    '11:00', '12:00', 'CS-401'),
  (4,  2, 'Database Systems',    'Monday',    '10:00', '11:00', 'CS-302'),
  (5,  2, 'Database Systems',    'Thursday',  '10:00', '11:00', 'CS-302'),
  (6,  2, 'Data Structures',     'Tuesday',   '09:00', '10:00', 'CS-303'),
  (7,  3, 'Calculus',            'Monday',    '11:00', '12:00', 'MA-101'),
  (8,  3, 'Linear Algebra',      'Wednesday', '14:00', '15:00', 'MA-201'),
  (9,  4, 'Digital Electronics', 'Tuesday',   '11:00', '12:00', 'EC-201'),
  (10, 4, 'Signals & Systems',   'Thursday',  '14:00', '15:00', 'EC-301'),
  (11, 5, 'Algorithms',          'Monday',    '14:00', '15:00', 'CS-402'),
  (12, 5, 'Data Structures',     'Friday',    '09:00', '10:00', 'CS-304'),
  (13, 6, 'Probability',         'Tuesday',   '14:00', '15:00', 'MA-301'),
  (14, 6, 'Calculus',            'Thursday',  '09:00', '10:00', 'MA-102'),
  (15, 7, 'Thermodynamics',      'Monday',    '09:00', '10:00', 'ME-201'),
  (16, 7, 'Fluid Mechanics',     'Wednesday', '11:00', '12:00', 'ME-301'),
  (17, 8, 'Operating Systems',   'Tuesday',   '10:00', '11:00', 'CS-305'),
  (18, 8, 'Computer Networks',   'Friday',    '14:00', '15:00', 'CS-405')
ON CONFLICT (id) DO NOTHING;

SELECT setval('timetable_id_seq', 30);

-- Leave Requests
INSERT INTO leave_requests (id, faculty_id, from_date, to_date, reason, status, impact_score) VALUES
  (1, 1, '2025-04-10', '2025-04-11', 'Medical appointment', 'approved', 4.2),
  (2, 2, '2025-04-14', '2025-04-14', 'Family function',     'pending',  2.8),
  (3, 3, '2025-04-17', '2025-04-18', 'Conference',          'approved', 3.5)
ON CONFLICT (id) DO NOTHING;

SELECT setval('leave_requests_id_seq', 10);

-- Substitutions
INSERT INTO substitutions (id, leave_id, original_faculty_id, substitute_faculty_id, class_id, status) VALUES
  (1, 1, 1, 5, 'CS-301', 'confirmed')
ON CONFLICT (id) DO NOTHING;

SELECT setval('substitutions_id_seq', 10);

-- Dept Scores
INSERT INTO dept_scores (department_id, date, score) VALUES
  (1, '2025-04-01', 87),
  (1, '2025-04-07', 91),
  (1, '2025-04-14', 78),
  (2, '2025-04-01', 95),
  (2, '2025-04-07', 88),
  (2, '2025-04-14', 92),
  (3, '2025-04-01', 72),
  (3, '2025-04-07', 80),
  (3, '2025-04-14', 85),
  (4, '2025-04-01', 68),
  (4, '2025-04-07', 74),
  (4, '2025-04-14', 70)
ON CONFLICT (department_id, date) DO NOTHING;
