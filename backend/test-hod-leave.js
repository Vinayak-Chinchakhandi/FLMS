const BASE = 'http://localhost:3000/api';

// Test HOD leave flow
const testHODLeave = async () => {
  console.log('Testing HOD leave flow...\n');

  // Login as HOD
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nikhil@college.edu', password: 'password' }),
  });
  const auth = await loginRes.json();
  console.log('HOD login:', loginRes.status, auth.success, auth.user.role);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` };

  // Apply HOD leave
  const applyRes = await fetch(`${BASE}/leave/apply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      faculty_id: 9,
      from_date: '2026-04-20',
      to_date: '2026-04-21',
      reason: 'Conference',
      acting_hod_id: 1, // Dr. Arjun Mehta
    }),
  });
  const applyData = await applyRes.json();
  console.log('HOD apply leave:', applyRes.status, applyData.success, applyData.message);

  if (applyData.success) {
    console.log('Auto-approved:', applyData.data.autoApproved);
    console.log('Acting HOD assigned:', applyData.data.actingHodName);
  }

  // Check if acting HOD can access HOD routes
  const actingLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@college.edu', password: 'password' }),
  });
  const actingAuth = await actingLoginRes.json();
  console.log('Acting HOD login:', actingLoginRes.status, actingAuth.success, actingAuth.user.acting_role);

  const actingHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${actingAuth.token}` };

  const hodDashboardRes = await fetch(`${BASE}/hod/dashboard/1`, {
    method: 'GET',
    headers: actingHeaders,
  });
  const hodData = await hodDashboardRes.json();
  console.log('Acting HOD dashboard access:', hodDashboardRes.status, hodData.success ? 'ALLOWED' : hodData.message);
};

testHODLeave().catch(console.error);