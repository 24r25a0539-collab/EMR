const http = require('http');

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('STARTING APEX EMR PATIENT MODULE AUTOMATED E2E SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. TEST PATIENT LOGIN VIA MOBILE
    console.log('\n--- 1. Patient Login via Mobile Number ---');
    const otpRes1 = await post('http://localhost:5000/api/auth/patient/request-otp', { identifier: '9511468587' });
    assert(otpRes1.status === 200 && otpRes1.body.success, 'Request OTP via Mobile 9511468587');
    
    const verifyRes1 = await post('http://localhost:5000/api/auth/patient/verify-otp', { identifier: '9511468587', otp: '123456' });
    assert(verifyRes1.status === 200 && !!verifyRes1.body.token, 'Verify OTP via Mobile -> Received JWT token');
    const patientToken = verifyRes1.body.token;
    const patientUser = verifyRes1.body.user;
    assert(!!patientUser?.patient?.healthId, `Resolved Healthcare ID: ${patientUser?.patient?.healthId}`);

    // 2. TEST PATIENT LOGIN VIA HEALTHCARE ID
    console.log('\n--- 2. Patient Login via Healthcare ID ---');
    const healthId = patientUser?.patient?.healthId || 'HP-100250';
    const otpRes2 = await post('http://localhost:5000/api/auth/patient/request-otp', { identifier: healthId });
    assert(otpRes2.status === 200 && otpRes2.body.success, `Request OTP via Healthcare ID ${healthId}`);

    const verifyRes2 = await post('http://localhost:5000/api/auth/patient/verify-otp', { identifier: healthId, otp: '123456' });
    assert(verifyRes2.status === 200 && verifyRes2.body.user?.patient?.id === patientUser.patient.id, 'Resolved SAME patient account via Healthcare ID');

    // 3. TEST PATIENT LOGIN VIA ABHA ID
    console.log('\n--- 3. Patient Login via ABHA ID ---');
    const abhaId = '12345678901234';
    const otpRes3 = await post('http://localhost:5000/api/auth/patient/request-otp', { identifier: abhaId });
    assert(otpRes3.status === 200 && otpRes3.body.success, `Request OTP via ABHA ID ${abhaId}`);

    const verifyRes3 = await post('http://localhost:5000/api/auth/patient/verify-otp', { identifier: abhaId, otp: '123456' });
    assert(verifyRes3.status === 200 && verifyRes3.body.user?.patient?.id === patientUser.patient.id, 'Resolved SAME patient account via ABHA ID');

    // 4. TEST PATIENT REGISTRATION ABHA ID VALIDATION
    console.log('\n--- 4. Patient Registration Mandatory ABHA ID Validation ---');
    const regFail = await post('http://localhost:5000/api/auth/patient/register', {
      fullName: 'Test Patient Without ABHA',
      dateOfBirth: '1995-05-15',
      gender: 'MALE',
      phone: '9111222333',
      otp: '123456',
      // abhaId missing
    });
    assert(regFail.status === 400 && String(regFail.body.message || regFail.body.error).includes('ABHA'), 'Registration rejected when ABHA ID is missing');

    const regFailFormat = await post('http://localhost:5000/api/auth/patient/register', {
      fullName: 'Test Patient Invalid ABHA',
      dateOfBirth: '1995-05-15',
      gender: 'MALE',
      phone: '9111222334',
      otp: '123456',
      abhaId: '123', // invalid format
    });
    assert(regFailFormat.status === 400, 'Registration rejected when ABHA ID is not 14 digits');

    // 5. TEST PATIENT PROFILE & SYNCHRONIZATION
    console.log('\n--- 5. Patient Profile & PostgreSQL Data Sync ---');
    const profileRes = await get('http://localhost:5000/api/patients/me/profile', patientToken);
    assert(profileRes.status === 200 && profileRes.body.success, 'Profile endpoint returned 200');
    assert(profileRes.body.patient?.fullName === patientUser.name || profileRes.body.patient?.fullName === patientUser.patient.fullName, 'Profile matches PostgreSQL user');
    assert(profileRes.body.patient?.abhaId === '12345678901234', `ABHA ID present: ${profileRes.body.patient?.abhaId}`);
    assert(typeof profileRes.body.patient?.age === 'number', `Dynamic age calculated: ${profileRes.body.patient?.age}`);

    // 6. TEST DIRECTORY APIS
    console.log('\n--- 6. Public Directory APIs (Doctors & Hospitals) ---');
    const docsRes = await get('http://localhost:5000/api/doctors');
    assert(docsRes.status === 200 && Array.isArray(docsRes.body.doctors), `Doctors directory returned ${docsRes.body.doctors?.length} verified doctors`);

    const hospsRes = await get('http://localhost:5000/api/hospitals');
    assert(hospsRes.status === 200 && Array.isArray(hospsRes.body.hospitals), `Hospitals directory returned ${hospsRes.body.hospitals?.length} registered hospitals`);

    // 7. TEST APPOINTMENTS & REAL-TIME DATA
    console.log('\n--- 7. Appointments & Health Activity ---');
    const apptsRes = await get('http://localhost:5000/api/patients/me/appointments', patientToken);
    assert(apptsRes.status === 200 && apptsRes.body.success, 'Patient appointments retrieved from PostgreSQL');

    const labsRes = await get('http://localhost:5000/api/patients/me/labs', patientToken);
    assert(labsRes.status === 200 && labsRes.body.success, 'Patient lab reports retrieved from PostgreSQL');

    const permsRes = await get('http://localhost:5000/api/patients/me/access-permissions', patientToken);
    assert(permsRes.status === 200 && permsRes.body.success, 'Patient access permissions retrieved from PostgreSQL');

    const notifsRes = await get('http://localhost:5000/api/patients/me/notifications', patientToken);
    assert(notifsRes.status === 200 && notifsRes.body.success, 'Patient notifications retrieved from PostgreSQL');

    const medsRes = await get('http://localhost:5000/api/patients/me/medicines', patientToken);
    assert(medsRes.status === 200 && medsRes.body.success, 'Patient medicines retrieved from PostgreSQL');

    const auditRes = await get('http://localhost:5000/api/patients/me/audit', patientToken);
    assert(auditRes.status === 200 && auditRes.body.success, 'Patient audit events retrieved from PostgreSQL');

    console.log('\n========================================================');
    console.log(`E2E TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');
  } catch (err) {
    console.error('Fatal Test Exception:', err);
  }
}

runTests();
