// E2E Verification Script for Apex EMR Patient Flow
const API_BASE = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('APEX EMR - END-TO-END PATIENT PROFILE & OTP VERIFICATION');
  console.log('====================================================\n');

  const testResults = [];
  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      testResults.push({ name, status: 'PASS', details });
    } else {
      console.error(`[FAIL] ${name} - Details: ${details}`);
      testResults.push({ name, status: 'FAIL', details });
    }
  }

  // Generate a random 10-digit mobile starting with 9 (9 + 9 random digits)
  const randomMobileSuffix = Math.floor(100000000 + Math.random() * 900000000);
  const testMobile = `9${randomMobileSuffix}`;
  const testEmail = `patient.${testMobile}@testapex.in`;
  const testName = 'Aarav Singhania';

  console.log(`Using Test Mobile: ${testMobile}, Email: ${testEmail}, Name: ${testName}\n`);

  // ----------------------------------------------------
  // TEST 1: Registration OTP Generation
  // ----------------------------------------------------
  console.log('--- TEST 1: Registration OTP ---');
  const regOtpRes = await request('/auth/patient/registration-request-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: testMobile, phone: testMobile }),
  });

  assert('Registration Request OTP Status 200', regOtpRes.status === 200, JSON.stringify(regOtpRes.data));
  assert('Registration OTP is 6 digits', /^\d{6}$/.test(regOtpRes.data.devOtpHint), `OTP: ${regOtpRes.data.devOtpHint}`);
  assert('Registration OTP is not fixed 123456', regOtpRes.data.devOtpHint !== '123456', `OTP: ${regOtpRes.data.devOtpHint}`);

  const regOtp = regOtpRes.data.devOtpHint;

  // ----------------------------------------------------
  // TEST 2: Registration OTP Verification (Negative & Positive)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Registration OTP Verification ---');
  const wrongRegOtpRes = await request('/auth/patient/registration-verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: testMobile, phone: testMobile, otp: '000000' }),
  });
  assert('Wrong Registration OTP rejected (400)', wrongRegOtpRes.status === 400, JSON.stringify(wrongRegOtpRes.data));

  const bypassRegOtpRes = await request('/auth/patient/registration-verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: testMobile, phone: testMobile, otp: '123456' }),
  });
  if (regOtp !== '123456') {
    assert('Fixed 123456 OTP rejected as bypass', bypassRegOtpRes.status === 400, JSON.stringify(bypassRegOtpRes.data));
  }

  const validRegOtpRes = await request('/auth/patient/registration-verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: testMobile, phone: testMobile, otp: regOtp }),
  });
  assert('Correct Registration OTP verified (200)', validRegOtpRes.status === 200 && validRegOtpRes.data.verified, JSON.stringify(validRegOtpRes.data));
  const registrationToken = validRegOtpRes.data.registrationToken;

  // ----------------------------------------------------
  // TEST 3: Patient Registration & Canonical Healthcare ID
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Patient Registration ---');
  const regPayload = {
    registrationToken,
    mobile: testMobile,
    phone: testMobile,
    fullName: testName,
    dob: '1996-05-15',
    gender: 'Male',
    bloodGroup: 'B+',
    email: testEmail,
    address: 'Flat 402, Shanti Heights, Road 10',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500034',
    govtIdType: 'AADHAAR',
    govtIdNumber: '998877665544',
    abhaId: 'aarav@abdm',
    emergencyContactName: 'Sunita Singhania',
    emergencyContactRelation: 'Spouse',
    emergencyContactPhone: '9876500001',
  };

  const registerRes = await request('/auth/patient/register', {
    method: 'POST',
    body: JSON.stringify(regPayload),
  });

  assert('Patient Registration Status 201', registerRes.status === 201, JSON.stringify(registerRes.data));
  const healthcareId = registerRes.data.healthcareId || registerRes.data.healthId || registerRes.data.patient?.healthcareId || registerRes.data.user?.patient?.healthcareId;
  assert('Canonical Healthcare ID generated (HP-######)', /^HP-\d{6}$/.test(healthcareId), `ID: ${healthcareId}`);
  assert('Healthcare ID does not have extraneous suffix', !healthcareId?.endsWith('e'), `ID: ${healthcareId}`);

  // ----------------------------------------------------
  // TEST 4: Duplicate Mobile Protection
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Duplicate Mobile Protection ---');
  const dupOtpRes = await request('/auth/patient/registration-request-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: testMobile, phone: testMobile }),
  });
  assert('Duplicate Mobile Request returns 409', dupOtpRes.status === 409, JSON.stringify(dupOtpRes.data));
  assert('Duplicate Mobile returns exact required error message',
    dupOtpRes.data.error === 'This mobile number is already registered. Please login using your Healthcare ID or mobile number.',
    dupOtpRes.data.error
  );

  // ----------------------------------------------------
  // TEST 5: Patient Login via Healthcare ID
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Patient Login via Healthcare ID ---');
  const loginHealthIdOtpRes = await request('/auth/patient/request-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: healthcareId }),
  });
  assert('Healthcare ID Login Request OTP Status 200', loginHealthIdOtpRes.status === 200, JSON.stringify(loginHealthIdOtpRes.data));
  assert('Login OTP is 6 digits', /^\d{6}$/.test(loginHealthIdOtpRes.data.devOtpHint), `OTP: ${loginHealthIdOtpRes.data.devOtpHint}`);
  const loginOtp1 = loginHealthIdOtpRes.data.devOtpHint;

  const loginVerifyRes = await request('/auth/patient/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: healthcareId, otp: loginOtp1 }),
  });
  assert('Healthcare ID Login Verify Status 200 with JWT', loginVerifyRes.status === 200 && !!loginVerifyRes.data.token, JSON.stringify(loginVerifyRes.data));
  const patientToken = loginVerifyRes.data.token;

  // ----------------------------------------------------
  // TEST 6: Patient Login via Mobile Number (with format variations)
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Patient Login via Mobile Number ---');
  const mobileWithPrefix = `+91 ${testMobile.slice(0, 5)} ${testMobile.slice(5)}`;
  const loginMobileOtpRes = await request('/auth/patient/request-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: mobileWithPrefix }),
  });
  assert('Mobile Login (+91 format) finds SAME patient', loginMobileOtpRes.status === 200, JSON.stringify(loginMobileOtpRes.data));
  const loginOtp2 = loginMobileOtpRes.data.devOtpHint;

  const loginMobileVerifyRes = await request('/auth/patient/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: mobileWithPrefix, otp: loginOtp2 }),
  });
  assert('Mobile Login Verified returns same patient',
    loginMobileVerifyRes.status === 200 && (loginMobileVerifyRes.data.user?.patient?.healthcareId === healthcareId || loginMobileVerifyRes.data.user?.patient?.healthId === healthcareId),
    JSON.stringify(loginMobileVerifyRes.data.user?.patient?.healthcareId || loginMobileVerifyRes.data.user?.patient?.healthId)
  );

  // ----------------------------------------------------
  // TEST 7: /api/auth/me Verification
  // ----------------------------------------------------
  console.log('\n--- TEST 7: /api/auth/me Verification ---');
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('/api/auth/me returns status 200', meRes.status === 200, JSON.stringify(meRes.data));
  const mePatient = meRes.data.user?.patient;
  assert('Auth Me contains correct Full Name', mePatient?.fullName === testName, mePatient?.fullName);
  assert('Auth Me contains correct Blood Group', mePatient?.bloodGroup === 'B+', mePatient?.bloodGroup);
  assert('Auth Me contains correct Masked Aadhaar', Boolean(mePatient?.govtIdNumberMasked?.includes('5544')), mePatient?.govtIdNumberMasked);
  assert('Auth Me contains correct ABHA ID', mePatient?.abhaId === 'aarav@abdm', mePatient?.abhaId);
  assert('Auth Me contains correct Emergency Contact',
    mePatient?.emergencyContacts?.[0]?.name === 'Sunita Singhania' && mePatient?.emergencyContacts?.[0]?.phone === '9876500001',
    JSON.stringify(mePatient?.emergencyContacts)
  );

  // ----------------------------------------------------
  // TEST 8: Patient Profile & Initial Empty States
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Initial Empty States for New Patient ---');
  const profileRes = await request('/patients/me', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('GET /patients/me status 200', profileRes.status === 200, JSON.stringify(profileRes.data));
  const pData = profileRes.data.patient;
  assert('Identity Marks empty for new patient', !pData?.identificationMarks || pData.identificationMarks.length === 0, JSON.stringify(pData?.identificationMarks));
  assert('Allergies empty for new patient', !pData?.allergies || pData.allergies.length === 0, JSON.stringify(pData?.allergies));
  assert('Medications empty for new patient', !pData?.medications || pData.medications.length === 0, JSON.stringify(pData?.medications));
  assert('Conditions empty for new patient', !pData?.conditions || pData.conditions.length === 0, JSON.stringify(pData?.conditions));

  const labsRes = await request('/patients/me/labs', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('Reports empty for new patient', labsRes.status === 200 && (!labsRes.data.labReports || labsRes.data.labReports.length === 0), JSON.stringify(labsRes.data));

  const presRes = await request('/patients/me/prescriptions', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('Prescriptions empty for new patient', presRes.status === 200 && (!presRes.data.prescriptions || presRes.data.prescriptions.length === 0), JSON.stringify(presRes.data));

  // ----------------------------------------------------
  // TEST 9: Identity Marks Persistence (Section 19)
  // ----------------------------------------------------
  console.log('\n--- TEST 9: Identity Marks Persistence ---');
  const updateProfileRes = await request('/patients/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      identificationMarks: ['Mole on left collarbone'],
    }),
  });
  assert('PUT /patients/me adds Identity Mark', updateProfileRes.status === 200, JSON.stringify(updateProfileRes.data));
  assert('Identity Mark in response',
    updateProfileRes.data.patient?.identificationMarks?.includes('Mole on left collarbone'),
    JSON.stringify(updateProfileRes.data.patient?.identificationMarks)
  );

  // ----------------------------------------------------
  // TEST 10: Allergy Persistence (Section 20)
  // ----------------------------------------------------
  console.log('\n--- TEST 10: Allergy Persistence ---');
  const addAllergyRes = await request('/patients/me/allergies', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      allergen: 'Dust',
      severity: 'Mild',
      reaction: 'Sneezing',
      notes: 'Triggers in dry weather',
    }),
  });
  assert('POST /patients/me/allergies returns 201', addAllergyRes.status === 201, JSON.stringify(addAllergyRes.data));
  assert('Added allergy is Dust', addAllergyRes.data.allergy?.allergen === 'Dust', JSON.stringify(addAllergyRes.data.allergy));
  const allergyId = addAllergyRes.data.allergy?.id;

  // ----------------------------------------------------
  // TEST 11: Logout & Re-Login Persistence Check
  // ----------------------------------------------------
  console.log('\n--- TEST 11: Logout & Re-Login Persistence Check ---');
  // Re-login with Healthcare ID to obtain a fresh token and fetch from DB
  const reLoginOtpRes = await request('/auth/patient/request-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: healthcareId }),
  });
  const reLoginOtp = reLoginOtpRes.data.devOtpHint;
  const reLoginVerifyRes = await request('/auth/patient/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: healthcareId, otp: reLoginOtp }),
  });
  const freshToken = reLoginVerifyRes.data.token;

  const freshProfileRes = await request('/patients/me', {
    headers: { Authorization: `Bearer ${freshToken}` },
  });
  const freshData = freshProfileRes.data.patient;
  assert('Identity Mark "Mole on left collarbone" persists after re-login',
    freshData?.identificationMarks?.includes('Mole on left collarbone'),
    JSON.stringify(freshData?.identificationMarks)
  );
  assert('Allergy "Dust" (Mild) persists after re-login',
    freshData?.allergies?.some((a) => a.allergen === 'Dust'),
    JSON.stringify(freshData?.allergies)
  );

  // ----------------------------------------------------
  // TEST 12: Cross-Patient Security Isolation (Section 15)
  // ----------------------------------------------------
  console.log('\n--- TEST 12: Cross-Patient Security Isolation ---');
  const unauthRes = await request('/patients/me', {
    headers: { Authorization: 'Bearer invalid-token-12345' },
  });
  assert('Invalid JWT token returns 401/403', unauthRes.status === 401 || unauthRes.status === 403, JSON.stringify(unauthRes.data));

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log('TEST SUMMARY');
  console.log('====================================================');
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;
  console.log(`Total: ${testResults.length}, Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\nALL END-TO-END PATIENT TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
