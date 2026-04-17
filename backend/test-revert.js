const BASE = 'http://localhost:3000/api';

// Test auto revert
const testAutoRevert = async () => {
  console.log('Testing auto revert...\n');

  // Login as HOD
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nikhil@college.edu', password: 'password' }),
  });
  const auth = await loginRes.json();
  console.log('HOD login:', loginRes.status, auth.success);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` };

  // Apply HOD leave in the past
  const applyRes = await fetch(`${BASE}/leave/apply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      faculty_id: 9,
      from_date: '2025-04-10',
      to_date: '2025-04-11',
      reason: 'Past conference',
      acting_hod_id: 1,
    }),
  });
  const applyData = await applyRes.json();
  console.log('Past HOD leave:', applyRes.status, applyData.success);

  // Check acting HOD assignment
  const hodDashboardRes = await fetch(`${BASE}/hod/dashboard/1`, { headers });
  const hodData = await hodDashboardRes.json();
  console.log('Acting HOD assignment:', hodData.data?.actingHod ? 'EXISTS' : 'NONE');

  // Login as acting HOD
  const actingLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@college.edu', password: 'password' }),
  });
  const actingAuth = await actingLoginRes.json();
  console.log('Acting HOD login, acting_role should be reverted:', actingAuth.user.acting_role);

  const actingHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${actingAuth.token}` };

  // Try to access HOD dashboard
  const actingHodRes = await fetch(`${BASE}/hod/dashboard/1`, { headers: actingHeaders });
  console.log('Acting HOD access after revert:', actingHodRes.status, actingHodRes.status === 403 ? 'CORRECTLY DENIED' : 'INCORRECTLY ALLOWED');
};

testAutoRevert().catch(console.error);