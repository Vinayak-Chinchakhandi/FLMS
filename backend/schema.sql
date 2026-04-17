-- ===============================
-- USERS (CREATE FIRST)
-- ===============================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL,
  department_id INTEGER,
  skills TEXT[],
  max_leaves INTEGER DEFAULT 12,
  leaves_taken INTEGER DEFAULT 0,
  acting_role VARCHAR(20)
);

-- ===============================
-- DEPARTMENTS
-- ===============================
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  hod_id INTEGER
);

-- ===============================
-- ADD FK AFTER BOTH TABLES EXIST
-- ===============================
ALTER TABLE users
ADD CONSTRAINT fk_users_department
FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE departments
ADD CONSTRAINT fk_departments_hod
FOREIGN KEY (hod_id) REFERENCES users(id);

-- ===============================
-- OTHER TABLES
-- ===============================
CREATE TABLE timetable (
  id SERIAL PRIMARY KEY,
  faculty_id INTEGER REFERENCES users(id),
  subject VARCHAR(150),
  day VARCHAR(20),
  start_time VARCHAR(10),
  end_time VARCHAR(10),
  class_id VARCHAR(20)
);

CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  faculty_id INTEGER REFERENCES users(id),
  department_id INTEGER REFERENCES departments(id),
  from_date DATE,
  to_date DATE,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  impact_score NUMERIC(5,2) DEFAULT 0,
  is_hod_leave BOOLEAN DEFAULT false,
  acting_hod_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE substitutions (
  id SERIAL PRIMARY KEY,
  leave_id INTEGER REFERENCES leave_requests(id),
  original_faculty_id INTEGER REFERENCES users(id),
  substitute_faculty_id INTEGER REFERENCES users(id),
  class_id VARCHAR(20),
  subject VARCHAR(150),
  day VARCHAR(20),
  start_time VARCHAR(10),
  end_time VARCHAR(10),
  date DATE,
  status VARCHAR(20) CHECK (status IN ('assigned','accepted','rejected'))
);

CREATE TABLE impact_logs (
  id SERIAL PRIMARY KEY,
  leave_id INTEGER REFERENCES leave_requests(id),
  affected_classes INTEGER,
  unresolved_classes INTEGER,
  overload_score NUMERIC(5,2)
);

CREATE TABLE dept_scores (
  id SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES departments(id),
  date DATE,
  score INTEGER
);

CREATE TABLE acting_hod_assignments (
  id SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES departments(id),
  original_hod_id INTEGER REFERENCES users(id),
  acting_hod_id INTEGER REFERENCES users(id),
  from_date DATE,
  to_date DATE,
  active BOOLEAN DEFAULT true
);

-- ===============================
-- INDEXES
-- ===============================
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_leave_faculty ON leave_requests(faculty_id);
CREATE INDEX idx_substitute_faculty ON substitutions(substitute_faculty_id);