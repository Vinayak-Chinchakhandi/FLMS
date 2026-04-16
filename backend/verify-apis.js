const BASE = 'http://localhost:3000/api';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const run = async () => {
  console.log('Testing POST /api/auth/login');
  const authRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@college.edu', password: 'password' }),
  });
  const authJson = await authRes.json();
  console.log('login status', authRes.status, authJson.success);
  assert(authRes.status === 200, 'Login did not return 200');
  assert(authJson.success === true, 'Login success false');
  assert(authJson.token, 'Token missing');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authJson.token}` };

  const endpoints = [
    { name: 'GET /api/leave', path: '/leave', method: 'GET' },
    { name: 'GET /api/dashboard/heatmap', path: '/dashboard/heatmap', method: 'GET' },
    { name: 'GET /api/dashboard/leaderboard', path: '/dashboard/leaderboard', method: 'GET' },
    { name: 'GET /api/faculty/dashboard/1', path: '/faculty/dashboard/1', method: 'GET' },
    { name: 'GET /api/substitutions/1', path: '/substitutions/1', method: 'GET' },
  ];

  for (const ep of endpoints) {
    console.log(`Testing ${ep.name}`);
    const res = await fetch(`${BASE}${ep.path}`, { method: ep.method, headers });
    const data = await res.json();
    console.log(ep.name, res.status, data.success);
  }

  const evalRes = await fetch(`${BASE}/smart-evaluate`, {
    method: 'POST', headers, body: JSON.stringify({ faculty_id: 1, from_date: '2025-05-01', to_date: '2025-05-02', reason: 'Test evaluation' }),
  });
  console.log('POST /api/smart-evaluate', evalRes.status, (await evalRes.json()).success);

  const simRes = await fetch(`${BASE}/simulate`, {
    method: 'POST', headers, body: JSON.stringify({ faculty_id: 1, from_date: '2025-05-01', to_date: '2025-05-02', reason: 'Test simulation' }),
  });
  console.log('POST /api/simulate', simRes.status, (await simRes.json()).success);
};

run().catch((err) => {
  console.error('ERROR', err);
  process.exit(1);
});
