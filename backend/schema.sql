-- ─── IFLO PostgreSQL Schema ─────────────────────────────────────────────────
-- Run this once on your Railway PostgreSQL instance:
--   psql $DATABASE_URL -f schema.sql
-- Or paste into Railway's SQL editor.

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Users (faculty + admins)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'faculty', -- 'faculty' | 'admin'
  department_id INTEGER REFERENCES departments(id)
);

-- Timetable slots
CREATE TABLE IF NOT EXISTS timetable (
  id         SERIAL PRIMARY KEY,
  faculty_id INTEGER REFERENCES users(id),
  subject    VARCHAR(150) NOT NULL,
  day        VARCHAR(20)  NOT NULL,
  start_time VARCHAR(10)  NOT NULL,
  end_time   VARCHAR(10)  NOT NULL,
  class_id   VARCHAR(20)  NOT NULL
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id           SERIAL PRIMARY KEY,
  faculty_id   INTEGER REFERENCES users(id),
  from_date    DATE        NOT NULL,
  to_date      DATE        NOT NULL,
  reason       TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  impact_score NUMERIC(5,2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Substitutions
CREATE TABLE IF NOT EXISTS substitutions (
  id                    SERIAL PRIMARY KEY,
  leave_id              INTEGER REFERENCES leave_requests(id),
  original_faculty_id   INTEGER REFERENCES users(id),
  substitute_faculty_id INTEGER REFERENCES users(id),
  class_id              VARCHAR(20),
  status                VARCHAR(20) DEFAULT 'pending' -- 'pending' | 'confirmed'
);

-- Department performance scores (time-series)
CREATE TABLE IF NOT EXISTS dept_scores (
  id            SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES departments(id),
  date          DATE    NOT NULL,
  score         INTEGER NOT NULL,
  UNIQUE(department_id, date)
);

-- Impact logs per leave
CREATE TABLE IF NOT EXISTS impact_logs (
  id                SERIAL PRIMARY KEY,
  leave_id          INTEGER REFERENCES leave_requests(id),
  affected_classes  INTEGER DEFAULT 0,
  unresolved_classes INTEGER DEFAULT 0,
  overload_score    NUMERIC(5,2) DEFAULT 0
);
