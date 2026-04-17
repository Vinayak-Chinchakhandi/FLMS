const BASE = 'http://localhost:3000/api';

// Test faculty leave flow
const testFacultyLeave = async () => {
  console.log('Testing faculty leave flow...\n');

  // Login as faculty
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@college.edu', password: 'password' }),
  });
  const auth = await loginRes.json();
  console.log('Faculty login:', loginRes.status, auth.success, auth.user.role);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` };

  // Apply faculty leave
  const applyRes = await fetch(`${BASE}/leave/apply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      faculty_id: 1,
      from_date: '2026-04-25',
      to_date: '2026-04-25',
      reason: 'Medical checkup',
    }),
  });
  const applyData = await applyRes.json();
  console.log('Faculty apply leave:', applyRes.status, applyData.success, applyData.message);

  if (applyData.success) {
    console.log('Auto-approved:', applyData.data.autoApproved);
  }

  // Login as HOD to approve
  const hodLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nikhil@college.edu', password: 'password' }),
  });
  const hodAuth = await hodLoginRes.json();
  console.log('HOD login:', hodLoginRes.status, hodAuth.success);

  const hodHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${hodAuth.token}` };

  // Get leaves to find the new one
  const leavesRes = await fetch(`${BASE}/leave`, { headers: hodHeaders });
  const leavesData = await leavesRes.json();
  const newLeave = leavesData.data.find(l => l.reason === 'Medical checkup');
  console.log('New leave found:', !!newLeave, newLeave?.status);

  if (newLeave && newLeave.status === 'pending') {
    // Approve the leave
    const approveRes = await fetch(`${BASE}/leave/${newLeave.id}/status`, {
      method: 'PATCH',
      headers: hodHeaders,
      body: JSON.stringify({ status: 'approved' }),
    });
    const approveData = await approveRes.json();
    console.log('Approve leave:', approveRes.status, approveData.success);
  }
};

testFacultyLeave().catch(console.error);