import { chromium } from 'playwright';

const APP_URL = 'http://localhost:5174';
const DEBUG = false;

const log = (...args) => { if (DEBUG) console.log(...args); };

async function login(page, email, password) {
  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);

  const [loginResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST'),
    page.click('button:has-text("Sign In")'),
  ]);

  const data = await loginResponse.json();
  log('login data', data);
  return data;
}

async function applyLeaveAsFaculty(page, fromDate, toDate, reason) {
  await page.goto(`${APP_URL}/apply`, { waitUntil: 'networkidle' });
  await page.fill('#leave-from-date', fromDate);
  await page.fill('#leave-to-date', toDate);
  await page.fill('#leave-reason', reason);

  const [evalResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/smart-evaluate') && r.request().method() === 'POST'),
    page.click('button:has-text("Evaluate with AI")'),
  ]);
  const evalData = await evalResponse.json();
  log('evaluate data', evalData);

  const [applyResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/leave/apply') && r.request().method() === 'POST'),
    page.click('button:has-text("Submit Leave Request")'),
  ]);
  const applyData = await applyResponse.json();
  log('apply data', applyData);

  return { evalData, applyData };
}

async function approveFirstPendingLeave(page) {
  await page.goto(`${APP_URL}/hod`, { waitUntil: 'networkidle' });
  const approveButton = page.locator('button:has-text("Approve")').first();
  if (await approveButton.count() === 0) {
    throw new Error('No Approve button found on HOD dashboard');
  }

  const [patchResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/leave/') && r.request().method() === 'PATCH'),
    approveButton.click(),
  ]);
  const data = await patchResponse.json();
  log('approve response', data);
  return data;
}

async function acceptFirstSubstitution(page) {
  await page.goto(`${APP_URL}/faculty`, { waitUntil: 'networkidle' });
  const acceptButton = page.locator('button:has-text("Accept")').first();
  if (await acceptButton.count() === 0) {
    throw new Error('No Accept button found for substitute faculty');
  }
  const [patchResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/substitutions/') && r.request().method() === 'PATCH'),
    acceptButton.click(),
  ]);
  const data = await patchResponse.json();
  log('accept response', data);
  return data;
}

async function applyLeaveAsHod(page, fromDate, toDate, reason) {
  await page.goto(`${APP_URL}/apply`, { waitUntil: 'networkidle' });
  await page.fill('#leave-from-date', fromDate);
  await page.fill('#leave-to-date', toDate);
  await page.fill('#leave-reason', reason);

  const hasSelect = await page.locator('#acting-hod-select').count();
  if (!hasSelect) {
    throw new Error('Acting HOD selector not found on apply page for HOD');
  }
  const option = page.locator('#acting-hod-select option:not([value=""])').first();
  const value = await option.getAttribute('value');
  const name = await option.textContent();
  if (!value) throw new Error('No acting HOD option available');
  await page.selectOption('#acting-hod-select', value);
  log('selected acting hod', value, name?.trim());

  const [evalResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/smart-evaluate') && r.request().method() === 'POST'),
    page.click('button:has-text("Evaluate with AI")'),
  ]);
  await evalResponse.json();

  const [applyResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/leave/apply') && r.request().method() === 'POST'),
    page.click('button:has-text("Submit Leave Request")'),
  ]);
  const applyData = await applyResponse.json();
  log('HOD apply data', applyData);
  return { applyData, actingHodId: value, actingHodName: name?.trim() };
}

async function main() {
  const emailById = {
    1: 'arjun@college.edu',
    2: 'sunita@college.edu',
    3: 'kiran@college.edu',
    4: 'meena@college.edu',
    5: 'rajan@college.edu',
    6: 'divya@college.edu',
    7: 'sanjay@college.edu',
    8: 'priya@college.edu',
    9: 'nikhil@college.edu',
    10: 'meera@college.edu',
    11: 'rohit@college.edu',
    12: 'anjali@college.edu',
  };

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('Starting real UI verification...');

  // Faculty flow
  const facultyLogin = await login(page, 'arjun@college.edu', 'password');
  console.log('Faculty login success:', facultyLogin.success);

  const fromDate = '2028-01-10';
  const toDate = '2028-01-10';
  const leaveReason = 'UI test leave request';

  const facultyApply = await applyLeaveAsFaculty(page, fromDate, toDate, leaveReason);
  console.log('Faculty apply status:', facultyApply.applyData.data.leaveRequest.status);
  if (facultyApply.applyData.data.leaveRequest.status !== 'pending') {
    throw new Error('Faculty leave did not remain pending');
  }

  // HOD flow
  await login(page, 'nikhil@college.edu', 'password');
  const approveData = await approveFirstPendingLeave(page);
  console.log('HOD approve response status:', approveData.data.leave.status);
  if (approveData.data.leave.status !== 'approved') {
    throw new Error('Leave was not approved by HOD');
  }

  const assignedSubstituteEmail = approveData.data?.simulation?.substitutions?.find((s) => s.substitute?.email)?.substitute?.email;
  console.log('Assigned substitute email:', assignedSubstituteEmail || 'none found');
  if (!assignedSubstituteEmail) {
    throw new Error('No substitute assignment found after HOD approval');
  }

  // Substitute flow
  await login(page, assignedSubstituteEmail, 'password');
  const acceptData = await acceptFirstSubstitution(page);
  console.log('Substitution accepted status:', acceptData.data.status);
  if (acceptData.data.status !== 'accepted') {
    throw new Error('Substitution did not become accepted');
  }

  // Acting HOD flow
  await login(page, 'nikhil@college.edu', 'password');
  const hodApply = await applyLeaveAsHod(page, '2028-01-15', '2028-01-16', 'HOD UI auto-approved leave');
  console.log('HOD apply acting hod id:', hodApply.actingHodId);
  console.log('HOD leave autoApproved:', hodApply.applyData.data.autoApproved);
  if (!hodApply.applyData.data.autoApproved) {
    throw new Error('HOD leave was not auto-approved');
  }
  if (!hodApply.applyData.data.actingHodName) {
    throw new Error('Acting HOD name was not returned');
  }

  const actingHodEmail = emailById[hodApply.actingHodId];
  console.log('Acting HOD email:', actingHodEmail);
  if (!actingHodEmail) {
    throw new Error('Unable to resolve acting HOD email for id ' + hodApply.actingHodId);
  }

  // Acting HOD login should route to HOD view
  await login(page, actingHodEmail, 'password');
  await page.waitForLoadState('networkidle');
  const storedUser = await page.evaluate(() => localStorage.getItem('iflo_user'));
  console.log('Acting HOD stored user:', storedUser);
  await page.goto(`${APP_URL}/hod`, { waitUntil: 'networkidle' });
  const isHodAccessible = page.url().includes('/hod');
  console.log('Acting HOD URL after navigation:', page.url());
  if (!isHodAccessible) {
    throw new Error('Acting HOD could not access /hod route');
  }

  console.log('Real UI verification completed successfully.');
  await browser.close();

  console.log('Real UI verification completed successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error('UI verification failed:', err);
  process.exit(1);
});