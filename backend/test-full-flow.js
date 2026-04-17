// ─── Full E2E API Test Script ───────────────────────────────────────────────
// Tests the entire IFLO flow: login → apply → evaluate → approve → substitution → acting HOD

const BASE = 'http://localhost:3000/api';

async function api(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  return { status: res.status, ...json };
}

function assert(condition, msg) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ PASS: ${msg}`);
  }
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  IFLO — Full System API Test');
  console.log('═══════════════════════════════════════════════════\n');

  // ── 1. Login Tests ─────────────────────────────────────────────────────────
  console.log('▶ 1. LOGIN TESTS');

  // Faculty login
  const faculty1Login = await api('POST', '/auth/login', { email: 'arjun@college.edu', password: 'password' });
  assert(faculty1Login.success, 'Faculty login succeeds');
  assert(faculty1Login.token, 'Faculty gets token');
  assert(faculty1Login.user.role === 'faculty', 'Faculty role is "faculty"');
  assert(faculty1Login.user.acting_role === null, 'Faculty acting_role is null initially');
  assert(faculty1Login.user.department_id === 1, 'Faculty department_id correct');
  const facultyToken = faculty1Login.token;
  const facultyId = faculty1Login.user.id; // id=1

  // HOD login
  const hodLogin = await api('POST', '/auth/login', { email: 'nikhil@college.edu', password: 'password' });
  assert(hodLogin.success, 'HOD login succeeds');
  assert(hodLogin.user.role === 'hod', 'HOD role is "hod"');
  assert(hodLogin.user.acting_role === null, 'HOD acting_role is null');
  const hodToken = hodLogin.token;
  const hodId = hodLogin.user.id; // id=9

  // Faculty (Rajan, id=5) — will be assigned as substitute + acting HOD
  const faculty5Login = await api('POST', '/auth/login', { email: 'rajan@college.edu', password: 'password' });
  assert(faculty5Login.success, 'Faculty 5 (Rajan) login succeeds');
  const f5Token = faculty5Login.token;
  const f5Id = faculty5Login.user.id; // id=5

  // Invalid login
  const badLogin = await api('POST', '/auth/login', { email: 'wrong@college.edu', password: 'wrong' });
  assert(!badLogin.success && badLogin.status === 401, 'Invalid login returns 401');

  // ── 2. GET /api/users/me ── Verify user profile endpoint ───────────────────
  console.log('\n▶ 2. USER PROFILE TESTS');

  const me = await api('GET', '/users/me', null, facultyToken);
  assert(me.success, 'GET /users/me succeeds');
  assert(me.data.id === facultyId, 'Returns correct user id');
  assert(me.data.acting_role === null, 'acting_role is null');
  assert(me.data.max_leaves === 12, 'max_leaves returned');

  // ── 3. Leave Quota ─────────────────────────────────────────────────────────
  console.log('\n▶ 3. LEAVE QUOTA TESTS');

  const quota = await api('GET', `/users/leave-summary/${facultyId}`, null, facultyToken);
  assert(quota.success, 'GET /users/leave-summary succeeds');
  assert(typeof quota.data.max === 'number', 'max is number');
  assert(typeof quota.data.taken === 'number', 'taken is number');
  assert(typeof quota.data.remaining === 'number', 'remaining is number');

  // ── 4. Smart Evaluate ──────────────────────────────────────────────────────
  console.log('\n▶ 4. SMART EVALUATE TESTS');

  const evalRes = await api('POST', '/smart-evaluate', {
    faculty_id: facultyId, from_date: '2027-05-05', to_date: '2027-05-06', reason: 'Test leave'
  }, facultyToken);
  assert(evalRes.success, 'POST /smart-evaluate succeeds');
  assert(typeof evalRes.data.approvalScore === 'number', 'approvalScore is number');
  assert(['APPROVE', 'REVIEW', 'REJECT'].includes(evalRes.data.recommendation), 'recommendation is valid');

  // ── 5. Faculty Apply Leave (should be PENDING) ─────────────────────────────
  console.log('\n▶ 5. FACULTY APPLY LEAVE');

  const applyRes = await api('POST', '/leave/apply', {
    faculty_id: facultyId, from_date: '2027-05-05', to_date: '2027-05-06', reason: 'API test leave'
  }, facultyToken);
  assert(applyRes.success, 'POST /leave/apply succeeds for faculty');
  assert(applyRes.data.leaveRequest.status === 'pending', 'Faculty leave status is "pending"');
  assert(applyRes.data.autoApproved === false, 'autoApproved is false for faculty');
  const newLeaveId = applyRes.data.leaveRequest.id;

  // ── 6. GET all leaves ──────────────────────────────────────────────────────
  console.log('\n▶ 6. GET ALL LEAVES');

  const allLeaves = await api('GET', '/leave', null, facultyToken);
  assert(allLeaves.success, 'GET /leave succeeds');
  assert(allLeaves.count > 0, 'leave count > 0');

  // ── 7. GET single leave ────────────────────────────────────────────────────
  console.log('\n▶ 7. GET SINGLE LEAVE');

  const singleLeave = await api('GET', `/leave/${newLeaveId}`, null, facultyToken);
  assert(singleLeave.success, 'GET /leave/:id succeeds');
  assert(singleLeave.data.status === 'pending', 'Leave is still pending');

  // ── 8. HOD Dashboard ───────────────────────────────────────────────────────
  console.log('\n▶ 8. HOD DASHBOARD');

  const hodDash = await api('GET', '/hod/dashboard/1', null, hodToken);
  assert(hodDash.success, 'GET /hod/dashboard/1 succeeds');
  assert(hodDash.data.department.name === 'Computer Science', 'Department name correct');
  assert(hodDash.data.summary.pending > 0, 'Has pending leaves');

  // Faculty cannot access HOD dashboard
  const hodDashForbid = await api('GET', '/hod/dashboard/1', null, f5Token);
  assert(hodDashForbid.status === 403, 'Faculty blocked from HOD dashboard (403)');

  // ── 9. HOD Approves Faculty Leave ──────────────────────────────────────────
  console.log('\n▶ 9. HOD APPROVE LEAVE');

  const approveRes = await api('PATCH', `/leave/${newLeaveId}/status`, { status: 'approved' }, hodToken);
  assert(approveRes.success, 'PATCH /leave/:id/status (approved) succeeds');
  assert(approveRes.data.leave.status === 'approved', 'Leave status is now approved');
  assert(approveRes.data.simulation, 'Simulation result present');

  // Re-approve should fail
  const reApprove = await api('PATCH', `/leave/${newLeaveId}/status`, { status: 'approved' }, hodToken);
  assert(!reApprove.success, 'Re-approve is blocked');

  // ── 10. Substitution Status (HOD feedback loop) ────────────────────────────
  console.log('\n▶ 10. SUBSTITUTION STATUS');

  const subStatus = await api('GET', `/hod/substitution-status/${newLeaveId}`, null, hodToken);
  assert(subStatus.success, 'GET /hod/substitution-status/:leaveId succeeds');
  assert(typeof subStatus.data.total === 'number', 'total is number');
  assert(typeof subStatus.data.accepted === 'number', 'accepted is number');

  // ── 11. Faculty Dashboard ──────────────────────────────────────────────────
  console.log('\n▶ 11. FACULTY DASHBOARD');

  const facDash = await api('GET', `/faculty/dashboard/${facultyId}`, null, facultyToken);
  assert(facDash.success, 'GET /faculty/dashboard/:id succeeds');
  assert(facDash.data.user.id === facultyId, 'User id matches');
  assert(Array.isArray(facDash.data.timetable), 'timetable is array');
  assert(Array.isArray(facDash.data.leaves), 'leaves is array');

  // ── 12. Substitution Accept ────────────────────────────────────────────────
  console.log('\n▶ 12. SUBSTITUTION ACCEPT');

  // Get substitutions for faculty 5 (Rajan)
  const f5Subs = await api('GET', `/substitutions/${f5Id}`, null, f5Token);
  assert(f5Subs.success, 'GET /substitutions/:facultyId succeeds');

  if (f5Subs.data.length > 0) {
    const subToAccept = f5Subs.data.find(s => s.status === 'assigned');
    if (subToAccept) {
      const acceptRes = await api('PATCH', `/substitutions/${subToAccept.id}`, { status: 'accepted' }, f5Token);
      assert(acceptRes.success, 'PATCH /substitutions/:id (accepted) succeeds');
      assert(acceptRes.data.status === 'accepted', 'Substitution status is now accepted');
    } else {
      console.log('  ℹ️  No assigned substitutions to accept');
    }
  } else {
    console.log('  ℹ️  Faculty 5 has no substitutions');
  }

  // ── 13. Simulation API ─────────────────────────────────────────────────────
  console.log('\n▶ 13. SIMULATION API');

  const simRes = await api('POST', '/simulate', {
    faculty_id: facultyId, from_date: '2027-05-05', to_date: '2027-05-06'
  }, facultyToken);
  assert(simRes.success, 'POST /simulate succeeds for faculty');

  // HOD simulation (previously broken)
  const simHod = await api('POST', '/simulate', {
    faculty_id: hodId, from_date: '2027-05-05', to_date: '2027-05-06'
  }, hodToken);
  assert(simHod.success, 'POST /simulate succeeds for HOD (was broken, now fixed)');

  // ── 14. HOD Apply Leave (auto-approve + acting HOD) ────────────────────────
  console.log('\n▶ 14. HOD APPLY LEAVE');

  // HOD applies leave with acting_hod_id = 5 (Rajan, same dept)
  const hodApply = await api('POST', '/leave/apply', {
    faculty_id: hodId, from_date: '2027-06-01', to_date: '2027-06-02', reason: 'HOD conference',
    acting_hod_id: f5Id
  }, hodToken);
  assert(hodApply.success, 'HOD leave apply succeeds');
  assert(hodApply.data.leaveRequest.status === 'approved', 'HOD leave auto-approved');
  assert(hodApply.data.autoApproved === true, 'autoApproved is true for HOD');
  assert(hodApply.data.actingHodName, 'actingHodName returned');
  const hodLeaveId = hodApply.data.leaveRequest.id;

  // Verify acting HOD assignment
  const actingInfo = await api('GET', '/hod/acting/1', null, hodToken);
  assert(actingInfo.success, 'GET /hod/acting/:deptId succeeds');
  assert(actingInfo.data.active === true, 'Acting HOD is active');
  assert(actingInfo.data.actingHod?.id === f5Id, 'Correct acting HOD assigned');

  // ── 15. Acting HOD Access ──────────────────────────────────────────────────
  console.log('\n▶ 15. ACTING HOD ACCESS (CRITICAL)');

  // Faculty 5 (Rajan) is now acting HOD — verify they can access HOD routes
  // The middleware refreshes acting_role from live data on every request
  const actingDash = await api('GET', '/hod/dashboard/1', null, f5Token);
  assert(actingDash.success, 'Acting HOD can access HOD dashboard');
  assert(actingDash.data.department.name === 'Computer Science', 'Acting HOD sees correct department');

  // Acting HOD sees substitution status
  const actingSubStatus = await api('GET', `/hod/substitution-status/${hodLeaveId}`, null, f5Token);
  assert(actingSubStatus.success, 'Acting HOD can view substitution status');

  // Verify acting HOD info in /users/me
  const actingMe = await api('GET', '/users/me', null, f5Token);
  assert(actingMe.data.acting_role === 'hod', 'Acting HOD /users/me shows acting_role=hod');

  // ── 16. Acting HOD Approves Faculty Leave ──────────────────────────────────
  console.log('\n▶ 16. ACTING HOD APPROVES LEAVE');

  // Faculty 2 (Sunita) has a pending leave (id=2 in mock data)
  const actingApprove = await api('PATCH', '/leave/2/status', { status: 'approved' }, f5Token);
  assert(actingApprove.success, 'Acting HOD can approve leaves');
  assert(actingApprove.data.leave.status === 'approved', 'Leave approved by acting HOD');

  // ── 17. Acting HOD Re-login ────────────────────────────────────────────────
  console.log('\n▶ 17. ACTING HOD RE-LOGIN');

  const f5Relogin = await api('POST', '/auth/login', { email: 'rajan@college.edu', password: 'password' });
  assert(f5Relogin.success, 'Acting HOD re-login succeeds');
  assert(f5Relogin.user.acting_role === 'hod', 'Login response includes acting_role=hod');

  // ── 18. Dashboard APIs ─────────────────────────────────────────────────────
  console.log('\n▶ 18. GLOBAL DASHBOARD APIs');

  const heatmap = await api('GET', '/dashboard/heatmap', null, hodToken);
  assert(heatmap.success, 'GET /dashboard/heatmap succeeds');
  assert(Array.isArray(heatmap.data.heatmap), 'heatmap is array');

  const leaderboard = await api('GET', '/dashboard/leaderboard', null, hodToken);
  assert(leaderboard.success, 'GET /dashboard/leaderboard succeeds');
  assert(Array.isArray(leaderboard.data), 'leaderboard is array');

  // ── 19. HOD Leave Validation ───────────────────────────────────────────────
  console.log('\n▶ 19. VALIDATION TESTS');

  // HOD apply without acting_hod_id → should fail  
  const hodNoActing = await api('POST', '/leave/apply', {
    faculty_id: 10, from_date: '2027-07-01', to_date: '2027-07-02', reason: 'No acting'
  }, hodToken);
  // This is HOD id=10 (Maths), not id=9. But we're using hodToken (id=9).
  // Actually the server uses faculty_id from body. Let's use a Maths HOD for this.
  const meera = await api('POST', '/auth/login', { email: 'meera@college.edu', password: 'password' });
  const meeraToken = meera.token;

  const hodNoActing2 = await api('POST', '/leave/apply', {
    faculty_id: 10, from_date: '2027-07-01', to_date: '2027-07-02', reason: 'Missing acting HOD'
  }, meeraToken);
  assert(!hodNoActing2.success, 'HOD leave without acting_hod_id is rejected');

  // Invalid acting HOD (wrong department)
  const hodWrongDept = await api('POST', '/leave/apply', {
    faculty_id: 10, from_date: '2027-07-01', to_date: '2027-07-02', reason: 'Wrong dept',
    acting_hod_id: 1 // Arjun is in CS, not Maths
  }, meeraToken);
  assert(!hodWrongDept.success, 'Acting HOD from wrong department is rejected');

  // ── 20. Auth Guards ────────────────────────────────────────────────────────
  console.log('\n▶ 20. AUTH GUARD TESTS');

  const noAuth = await api('GET', '/leave');
  assert(noAuth.status === 401, 'No auth token → 401');

  const badToken = await api('GET', '/leave', null, 'BadToken123');
  assert(badToken.status === 401, 'Bad token → 401');

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ALL API TESTS COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
}

run().catch((err) => {
  console.error('\n💥 Test runner crashed:', err.message);
  process.exitCode = 1;
});
