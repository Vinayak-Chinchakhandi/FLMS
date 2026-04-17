const BASE = 'http://localhost:3000/api';

// Test API stability
const testAPIs = async () => {
  console.log('Testing API stability...\n');

  // Test auth
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@college.edu', password: 'password' }),
  });
  const auth = await loginRes.json();
  console.log('Auth login:', loginRes.status, auth.success);

  if (!auth.success) return;

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` };

  // Test endpoints
  const endpoints = [
    '/leave',
    '/smart-evaluate',
    '/simulate',
    '/dashboard/heatmap',
    '/faculty/dashboard/1',
    '/hod/dashboard/1', // Should fail for faculty
    '/substitutions',
    '/users',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BASE}${ep}`, {
        method: ep === '/leave' ? 'GET' : 'GET',
        headers: ep.includes('/hod/') ? { ...headers, 'X-Test': 'faculty-accessing-hod' } : headers,
      });
      const data = await res.json();
      console.log(`${ep}: ${res.status} ${data.success ? 'OK' : 'FAIL'} ${data.message || ''}`);
    } catch (e) {
      console.log(`${ep}: ERROR ${e.message}`);
    }
  }
};

testAPIs().catch(console.error);