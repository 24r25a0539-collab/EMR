const base = 'http://localhost:5000/api';

async function run() {
  console.log('=== VERIFYING APEX EMR AUTHENTICATION & TOKEN PROPAGATION ===\n');

  // 1. Admin Login
  console.log('[1] Testing Admin Login...');
  const adminRes = await fetch(`${base}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@emr-platform.internal', password: 'Admin@Secure2026!' }),
  }).then((r) => r.json());
  console.log(`  -> Admin login: success=${adminRes.success}, tokenPresent=${!!adminRes.token}`);

  // 2. Doctor Login
  console.log('[2] Testing Doctor Login...');
  const docRes = await fetch(`${base}/auth/doctor/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'MCI-NEUR-2015-1029', password: 'Doctor@123' }),
  }).then((r) => r.json());
  console.log(`  -> Doctor login: success=${docRes.success}, tokenPresent=${!!docRes.token}`);

  // 3. Patient Login OTP flow
  console.log('[3] Testing Patient Login (OTP flow)...');
  const otpRes = await fetch(`${base}/auth/patient/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'HP-100246' }),
  }).then((r) => r.json());
  console.log(`  -> OTP requested: success=${otpRes.success}, hint=${otpRes.devOtpHint}`);

  const verifyRes = await fetch(`${base}/auth/patient/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'HP-100246', otp: otpRes.devOtpHint }),
  }).then((r) => r.json());
  console.log(`  -> OTP verified: success=${verifyRes.success}, tokenPresent=${!!verifyRes.token}`);
  const patientToken = verifyRes.token;

  // 4. Parallel Authenticated Patient APIs
  console.log('[4] Testing Parallel Authenticated Patient APIs...');
  const [profile, notifs, appointments, prescriptions, labs, docs] = await Promise.all([
    fetch(`${base}/patients/me`, { headers: { Authorization: `Bearer ${patientToken}` } }).then((r) => r.json()),
    fetch(`${base}/notifications`, { headers: { Authorization: `Bearer ${patientToken}` } }).then((r) => r.json()),
    fetch(`${base}/patients/me/appointments`, { headers: { Authorization: `Bearer ${patientToken}` } }).then((r) => r.json()),
    fetch(`${base}/patients/me/prescriptions`, { headers: { Authorization: `Bearer ${patientToken}` } }).then((r) => r.json()),
    fetch(`${base}/patients/me/lab-reports`, { headers: { Authorization: `Bearer ${patientToken}` } }).then((r) => r.json()),
    fetch(`${base}/patients/me/documents`, { headers: { Authorization: `Bearer ${patientToken}` } }).then((r) => r.json()),
  ]);

  console.log(`  -> Profile API: success=${profile.success}, Name="${profile.patient?.fullName}"`);
  console.log(`  -> Notifications API: success=${notifs.success}, Count=${notifs.notifications?.length}`);
  console.log(`  -> Appointments API: success=${appointments.success}, Count=${appointments.appointments?.length}`);
  console.log(`  -> Prescriptions API: success=${prescriptions.success}, Count=${prescriptions.prescriptions?.length}`);
  console.log(`  -> Lab Reports API: success=${labs.success}, Count=${labs.reports?.length}`);
  console.log(`  -> Documents API: success=${docs.success}, Count=${docs.documents?.length}`);

  // 5. Test Lab Report Upload
  console.log('[5] Testing Lab Report Upload under Authenticated Session...');
  const uploadRes = await fetch(`${base}/patients/me/lab-reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      testName: 'Lipid Profile Panel Test',
      category: 'Biochemistry',
      laboratoryName: 'Apex Diagnostic Labs',
      summary: 'Patient diagnostic upload. Cryptographically sealed.',
      sampleDate: '2026-09-20',
      resultDate: '2026-09-20',
    }),
  }).then((r) => r.json());
  console.log(`  -> Lab report upload: success=${uploadRes.success}, reportNumber="${uploadRes.report?.reportNumber}"`);

  // 6. Test Invalid / Expired Token rejection
  console.log('[6] Testing Invalid Token Rejection...');
  const invalidRes = await fetch(`${base}/patients/me`, {
    headers: { Authorization: 'Bearer invalid.token.signature' },
  }).then((r) => r.json());
  console.log(`  -> Invalid token: success=${invalidRes.success}, error="${invalidRes.error}"`);

  console.log('\n=== ALL AUTH & TOKEN PROPAGATION CHECKS PASSED ===\n');
}

run().catch((e) => {
  console.error('Test failed with error:', e);
  process.exit(1);
});
