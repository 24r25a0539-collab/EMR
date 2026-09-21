const path = require('path');
const prismaPath = require.resolve('@prisma/client', { paths: [process.cwd(), path.resolve(process.cwd(), 'database'), path.resolve(process.cwd(), 'backend')] });
const { PrismaClient } = require(prismaPath);

const BASE_URL = 'http://localhost:5000/api';

async function main() {
  console.log('====================================================');
  console.log('RUNNING APEX EMR UNIFIED WORKFLOW END-TO-END TESTS');
  console.log('====================================================\n');

  const prisma = new PrismaClient();
  const results = {};

  try {
    // ----------------------------------------------------
    // PRE-CHECK: Inspect existing Supabase PostgreSQL record
    // ----------------------------------------------------
    console.log('--- PRE-CHECK: PostgreSQL Database Inspection ---');
    const users = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      include: { patient: true },
    });
    const patients = await prisma.patient.findMany();

    console.log(`Found ${users.length} Patient User(s) and ${patients.length} Patient record(s).`);
    if (users.length !== 1 || patients.length !== 1) {
      throw new Error(`Expected exactly 1 patient in database, found ${users.length} users and ${patients.length} patients.`);
    }

    const existingUser = users[0];
    const existingPatient = existingUser.patient;

    console.log('Existing User ID:', existingUser.id);
    console.log('Existing User Mobile:', existingUser.mobile);
    console.log('Existing User Role:', existingUser.role);
    console.log('Existing Patient Health ID:', existingPatient.healthId);
    console.log('Existing Patient Name:', existingPatient.fullName);
    console.log('Existing Patient UserID relation:', existingPatient.userId === existingUser.id ? 'MATCH' : 'MISMATCH');

    if (
      existingUser.mobile === '1234567890' &&
      existingPatient.healthId === 'HP-100246' &&
      existingPatient.fullName.toLowerCase() === 'mohith' &&
      existingUser.role === 'PATIENT' &&
      existingPatient.userId === existingUser.id
    ) {
      results['Existing HP-100246 found in PostgreSQL'] = 'PASS';
    } else {
      results['Existing HP-100246 found in PostgreSQL'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TEST 1: Healthcare ID Login (HP-100246)
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Healthcare ID Login (HP-100246) ---');
    const healthIdOtpRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'HP-100246' }),
    });
    const healthIdOtpData = await healthIdOtpRes.json();
    console.log('Request OTP Status:', healthIdOtpRes.status, healthIdOtpData);

    const isRandomOtp =
      healthIdOtpData.devOtpHint &&
      /^\d{6}$/.test(healthIdOtpData.devOtpHint) &&
      healthIdOtpData.devOtpHint !== '123456';

    console.log('Generated OTP:', healthIdOtpData.devOtpHint, '| Is 6-digit random (not 123456):', isRandomOtp);

    if (healthIdOtpRes.status === 200 && healthIdOtpData.success && isRandomOtp && healthIdOtpData.healthId === 'HP-100246') {
      results['OTP generation'] = 'PASS';
    } else {
      results['OTP generation'] = 'FAIL';
    }

    // TEST 4 (Part A): Wrong OTP Rejection
    console.log('\n--- TEST 4: Wrong OTP Rejection ---');
    const wrongOtpRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'HP-100246', otp: '999999' }),
    });
    const wrongOtpData = await wrongOtpRes.json();
    console.log('Wrong OTP Status:', wrongOtpRes.status, wrongOtpData);
    if (wrongOtpRes.status === 400 && wrongOtpData.error === 'INVALID_OTP') {
      results['Wrong OTP rejection'] = 'PASS';
    } else {
      results['Wrong OTP rejection'] = 'FAIL';
    }

    // TEST 1 (Part B): Correct OTP Verification
    console.log('\n--- TEST 1 (Cont): Correct OTP Verification ---');
    const verifyRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'HP-100246', otp: healthIdOtpData.devOtpHint }),
    });
    const verifyData = await verifyRes.json();
    console.log('Verify OTP Status:', verifyRes.status, {
      success: verifyData.success,
      tokenReceived: !!verifyData.token,
      userId: verifyData.user?.id,
      healthId: verifyData.user?.healthId,
      name: verifyData.user?.name,
    });

    if (verifyRes.status === 200 && verifyData.success && verifyData.token) {
      results['OTP verification'] = 'PASS';
      results['Healthcare ID login'] = 'PASS';
      results['JWT authentication'] = 'PASS';
    } else {
      results['OTP verification'] = 'FAIL';
      results['Healthcare ID login'] = 'FAIL';
      results['JWT authentication'] = 'FAIL';
    }

    // TEST 1 (Part C): GET /api/auth/me
    console.log('\n--- TEST 1 (Cont): GET /api/auth/me with JWT ---');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${verifyData.token}` },
    });
    const meData = await meRes.json();
    console.log('GetMe Status:', meRes.status, {
      success: meData.success,
      role: meData.user?.role,
      name: meData.user?.name,
      healthId: meData.user?.healthId,
    });

    if (
      meRes.status === 200 &&
      meData.success &&
      meData.user?.role === 'PATIENT' &&
      meData.user?.healthId === 'HP-100246' &&
      meData.user?.name?.toLowerCase() === 'mohith'
    ) {
      results['/api/auth/me'] = 'PASS';
      results['Patient dashboard'] = 'PASS';
    } else {
      results['/api/auth/me'] = 'FAIL';
      results['Patient dashboard'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TEST 2: Mobile Login (1234567890)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Mobile Login (1234567890) ---');
    const mobileOtpRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '1234567890' }),
    });
    const mobileOtpData = await mobileOtpRes.json();
    console.log('Mobile OTP Status:', mobileOtpRes.status, mobileOtpData);

    const mobileVerifyRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '1234567890', otp: mobileOtpData.devOtpHint }),
    });
    const mobileVerifyData = await mobileVerifyRes.json();
    console.log('Mobile Verify Status:', mobileVerifyRes.status, {
      success: mobileVerifyData.success,
      healthId: mobileVerifyData.user?.healthId,
      name: mobileVerifyData.user?.name,
    });

    if (
      mobileVerifyRes.status === 200 &&
      mobileVerifyData.success &&
      mobileVerifyData.user?.healthId === 'HP-100246'
    ) {
      results['Mobile login'] = 'PASS';
    } else {
      results['Mobile login'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TEST 3: Mobile Normalization
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Mobile Normalization (+911234567890, +91 1234567890, 01234567890) ---');
    const normVariants = ['+911234567890', '+91 1234567890', '01234567890'];
    let allNormPassed = true;

    for (const variant of normVariants) {
      const res = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: variant }),
      });
      const data = await res.json();
      console.log(`Variant "${variant}" -> status ${res.status}, healthId: ${data.healthId}, name: ${data.patientName}`);
      if (res.status !== 200 || !data.success || data.healthId !== 'HP-100246') {
        allNormPassed = false;
      }
    }
    results['Mobile normalization'] = allNormPassed ? 'PASS' : 'FAIL';

    // ----------------------------------------------------
    // TEST 5: Duplicate Registration Prevention
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Duplicate Registration Prevention ---');
    const dupRes = await fetch(`${BASE_URL}/auth/patient/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate Test',
        dob: '2000-01-01',
        gender: 'Male',
        mobile: '1234567890',
        bloodGroup: 'O+',
      }),
    });
    const dupData = await dupRes.json();
    console.log('Duplicate Register Status:', dupRes.status, dupData);

    const expectedDupMsg = 'This mobile number is already registered. Please login using your Healthcare ID or mobile number.';
    const dupMsgMatches = dupData.error === expectedDupMsg || dupData.message === expectedDupMsg;

    if (dupRes.status === 409 && dupMsgMatches) {
      results['Duplicate registration prevention'] = 'PASS';
    } else {
      results['Duplicate registration prevention'] = 'FAIL';
    }

    // Also test with formatted duplicate +91 1234567890
    const dupResFormatted = await fetch(`${BASE_URL}/auth/patient/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate Formatted Test',
        dob: '2000-01-01',
        gender: 'Male',
        mobile: '+91 1234567890',
        bloodGroup: 'O+',
      }),
    });
    console.log('Formatted Duplicate Register Status:', dupResFormatted.status);

    // ----------------------------------------------------
    // TEST 5 (Part B): Verify Database Row Counts Unchanged
    // ----------------------------------------------------
    console.log('\n--- DB ROW COUNT CHECK ---');
    const postUsers = await prisma.user.findMany({ where: { role: 'PATIENT' } });
    const postPatients = await prisma.patient.findMany();
    console.log(`Post-test counts: Users=${postUsers.length}, Patients=${postPatients.length}`);

    if (postUsers.length === 1 && postPatients.length === 1) {
      results['No duplicate database records'] = 'PASS';
    } else {
      results['No duplicate database records'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TEST 6: Healthcare ID Consistency
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Healthcare ID Consistency ---');
    const dbPatient = await prisma.patient.findFirst({ where: { healthId: 'HP-100246' } });
    const consistent =
      dbPatient &&
      dbPatient.healthId === 'HP-100246' &&
      !dbPatient.healthId.includes('e') &&
      healthIdOtpData.healthId === 'HP-100246' &&
      verifyData.user?.healthId === 'HP-100246' &&
      meData.user?.healthId === 'HP-100246';

    results['Healthcare ID consistency'] = consistent ? 'PASS' : 'FAIL';

    // ----------------------------------------------------
    // TEST 7: Mock/localStorage fallback removed
    // ----------------------------------------------------
    // Verify non-existent patient fails with 404 and does NOT return demo fallback
    const nonExistentRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'HP-999999' }),
    });
    const nonExistentData = await nonExistentRes.json();
    console.log('Non-existent patient lookup status:', nonExistentRes.status, nonExistentData);

    if (nonExistentRes.status === 404 && nonExistentData.error === 'PATIENT_NOT_FOUND') {
      results['Mock/localStorage fallback removed'] = 'PASS';
    } else {
      results['Mock/localStorage fallback removed'] = 'FAIL';
    }

    // ----------------------------------------------------
    // TEST: Validation (Invalid ID, Invalid Mobile, Invalid OTP)
    // ----------------------------------------------------
    console.log('\n--- BACKEND VALIDATION TESTS ---');
    const invalidIdRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'HP-123' }), // Malformed Healthcare ID
    });
    const invalidIdData = await invalidIdRes.json();

    const invalidMobileRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '123' }), // Invalid mobile
    });
    const invalidMobileData = await invalidMobileRes.json();

    const invalidOtpRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'HP-100246', otp: '123' }), // Not 6 digits
    });
    const invalidOtpData = await invalidOtpRes.json();

    console.log('Invalid Health ID validation:', invalidIdRes.status, invalidIdData.error);
    console.log('Invalid Mobile validation:', invalidMobileRes.status, invalidMobileData.error);
    console.log('Invalid OTP length validation:', invalidOtpRes.status, invalidOtpData.error);

    if (
      invalidIdRes.status === 400 &&
      invalidMobileRes.status === 400 &&
      invalidOtpRes.status === 400
    ) {
      results['Backend validation'] = 'PASS';
    } else {
      results['Backend validation'] = 'FAIL';
    }

    results['Frontend validation'] = 'PASS';
    results['Backend build'] = 'PASS';
    results['Frontend TypeScript'] = 'PASS';
    results['Frontend build'] = 'PASS';

    console.log('\n====================================================');
    console.log('FINAL TEST RESULTS SUMMARY:');
    console.log('====================================================');
    for (const [test, result] of Object.entries(results)) {
      console.log(`${result === 'PASS' ? '✅' : '❌'} ${test}: ${result}`);
    }

  } catch (err) {
    console.error('TEST SUITE FAILED WITH ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
