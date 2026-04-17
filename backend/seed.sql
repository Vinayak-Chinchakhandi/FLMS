INSERT INTO users (id, name, email, password, role, department_id, skills, max_leaves, leaves_taken, acting_role) VALUES
(1, 'Dr. Arjun Mehta', 'arjun@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'faculty', 1, ARRAY['data structures','algorithms'], 12, 2, NULL),
(2, 'Prof. Sunita Rao', 'sunita@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'faculty', 1, ARRAY['databases','system design'], 12, 1, NULL),
(3, 'Dr. Kiran Desai', 'kiran@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'faculty', 2, ARRAY['calculus','linear algebra'], 12, 1, NULL),
(4, 'Prof. Meena Iyer', 'meena@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'faculty', 3, ARRAY['digital electronics','signals'], 12, 0, NULL),
(5, 'Dr. Rajan Pillai', 'rajan@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'faculty', 1, ARRAY['algorithms','operating systems'], 12, 0, NULL),
(6, 'Prof. Divya Nair', 'divya@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'faculty', 2, ARRAY['probability','calculus'], 12, 0, NULL),
(7, 'Dr. Sanjay Gupta', 'sanjay@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'faculty', 4, ARRAY['thermodynamics','fluid mechanics'], 12, 0, NULL),
(8, 'Prof. Priya Kumar', 'priya@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'faculty', 1, ARRAY['operating systems','computer networks'], 12, 0, NULL),
(9, 'Dr. Nikhil Verma', 'nikhil@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'hod', 1, ARRAY['academic leadership'], 12, 0, NULL),
(10, 'Dr. Meera Joshi', 'meera@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'hod', 2, ARRAY['academic leadership'], 12, 0, NULL),
(11, 'Dr. Rohit Sharma', 'rohit@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'hod', 3, ARRAY['academic leadership'], 12, 0, NULL),
(12, 'Dr. Anjali Gupta', 'anjali@college.edu', '7cb3195e091d14a37737a2c9a99f78e4db11ba18fb010ffd2a2ce04c7440cc850a2b3d225981db0c2d3bbd21f06dd001d28dd65df7d328846c900261f99f1e17', 'hod', 4, ARRAY['academic leadership'], 12, 0, NULL);

INSERT INTO departments (id, name, hod_id) VALUES
(1, 'Computer Science', 9),
(2, 'Mathematics', 10),
(3, 'Electronics', 11),
(4, 'Mechanical', 12);

INSERT INTO timetable (id, faculty_id, subject, day, start_time, end_time, class_id) VALUES
(1,1,'Data Structures','Monday','09:00','10:00','CS-301'),
(2,1,'Data Structures','Wednesday','09:00','10:00','CS-301'),
(3,1,'Algorithms','Friday','11:00','12:00','CS-401'),
(4,2,'Database Systems','Monday','10:00','11:00','CS-302'),
(5,2,'Database Systems','Thursday','10:00','11:00','CS-302'),
(6,2,'Data Structures','Tuesday','09:00','10:00','CS-303'),
(7,3,'Calculus','Monday','11:00','12:00','MA-101'),
(8,3,'Linear Algebra','Wednesday','14:00','15:00','MA-201'),
(9,4,'Digital Electronics','Tuesday','11:00','12:00','EC-201'),
(10,4,'Signals & Systems','Thursday','14:00','15:00','EC-301'),
(11,5,'Algorithms','Monday','14:00','15:00','CS-402'),
(12,5,'Data Structures','Friday','09:00','10:00','CS-304'),
(13,6,'Probability','Tuesday','14:00','15:00','MA-301'),
(14,6,'Calculus','Thursday','09:00','10:00','MA-102'),
(15,7,'Thermodynamics','Monday','09:00','10:00','ME-201'),
(16,7,'Fluid Mechanics','Wednesday','11:00','12:00','ME-301'),
(17,8,'Operating Systems','Tuesday','10:00','11:00','CS-305'),
(18,8,'Computer Networks','Friday','14:00','15:00','CS-405');

INSERT INTO leave_requests (id, faculty_id, department_id, from_date, to_date, reason, status, impact_score, is_hod_leave, acting_hod_id) VALUES
(1,1,1,'2025-04-10','2025-04-11','Medical appointment','approved',4.2,false,NULL),
(2,2,1,'2025-04-14','2025-04-14','Family function','pending',2.8,false,NULL),
(3,3,2,'2025-04-17','2025-04-18','Conference','approved',3.5,false,NULL);

INSERT INTO substitutions (id, leave_id, original_faculty_id, substitute_faculty_id, class_id, subject, day, start_time, end_time, date, status) VALUES
(1,1,1,5,'CS-301','Data Structures','Monday','09:00','10:00','2025-04-10','accepted');

INSERT INTO impact_logs (leave_id, affected_classes, unresolved_classes, overload_score) VALUES
(1,2,0,1.2);

INSERT INTO dept_scores (department_id, date, score) VALUES
(1,'2025-04-01',87),
(1,'2025-04-07',91),
(1,'2025-04-14',78),
(2,'2025-04-01',95),
(2,'2025-04-07',88),
(2,'2025-04-14',92),
(3,'2025-04-01',72),
(3,'2025-04-07',80),
(3,'2025-04-14',85),
(4,'2025-04-01',68),
(4,'2025-04-07',74),
(4,'2025-04-14',70);