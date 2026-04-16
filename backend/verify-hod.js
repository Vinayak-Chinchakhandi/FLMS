const BASE = 'http://localhost:3000/api';

const run = async () => {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nikhil@college.edu', password: 'password' }),
  });
  const auth = await loginRes.json();
  console.log('HOD login', loginRes.status, auth.success, auth.user.role);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` };

  const dashboardRes = await fetch(`${BASE}/hod/dashboard/1`, { method: 'GET', headers });
  const dashboardJson = await dashboardRes.json();
  console.log('HOD dashboard', dashboardRes.status, dashboardJson.success, 'leaves', dashboardJson.data?.leaves?.length);

  const patchRes = await fetch(`${BASE}/leave/2/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'approved' }),
  });
  const patchJson = await patchRes.json();
  console.log('PATCH leave status', patchRes.status, patchJson.success);
  console.log('substitutions assigned', patchJson.data?.simulation?.substitutions?.length);
  console.log('first substitute', patchJson.data?.simulation?.substitutions?.[0]);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
