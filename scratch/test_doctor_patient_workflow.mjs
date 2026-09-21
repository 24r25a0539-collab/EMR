const API_BASE = 'http://localhost:5000/api';

async function req(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
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
  console.log('APEX EMR — REAL DOCTOR & PATIENT WORKFLOW E2E TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // STEP 1: REGISTER A REAL PATIENT (e.g. Kalyan)
  // ----------------------------------------------------
  console.log('--- TEST 1: Register Real Patient in PostgreSQL ---');
  const patientMobile = '98491' + Math.floor(10000 + Math.random() * 90000);
  const patientEmail = `kalyan.${Date.now()}@test.com`;
  
  const patRegRes = await req('/auth/patient/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Kalyan Kumar',
      dob: '1992-06-15',
      gender: 'Male',
      mobile: patientMobile,
      email: patientEmail,
      bloodGroup: 'O+',
      allergies: 'Penicillin (Severe)',
      conditions: 'Hypertension',
      address: 'Plot 42, Jubilee Hills, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      govtIdType: 'AADHAAR',
      govtIdNumber: '998877665544',
      identificationMarks: ['Linear surgical scar on right forearm', 'Small mole above left eyebrow'],
      emergencyContactName: 'Lakshmi Kumar',
      emergencyContactPhone: '9849199999',
      emergencyContactRelation: 'Spouse',
      abhaId: 'kalyan@abdm',
    }),
  });

  assert(patRegRes.status === 201 && patRegRes.data.success, 'Patient registered successfully in PostgreSQL');
  const patient = patRegRes.data.patient || patRegRes.data.data;
  const patientToken = patRegRes.data.token;
  const patientHealthId = patRegRes.data.healthId || patient.healthId;
  const patientId = patient.id;
  console.log(`    Registered Patient: ${patient.fullName} | Health ID: ${patientHealthId} | ID: ${patientId}`);

  // ----------------------------------------------------
  // STEP 2: DOCTOR REGISTRATION WITH MANDATORY CERTIFICATES
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Doctor Registration & Mandatory Documents ---');
  const docMobile = '98492' + Math.floor(10000 + Math.random() * 90000);
  const docEmail = `dr.joe.${Date.now()}@apexcare.in`;
  const docRegNumber = `TSMC-${Math.floor(100000 + Math.random() * 900000)}`;

  // Test 2a: Missing mandatory documents should FAIL
  const failDocRes = await req('/auth/doctor/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Dr. Joe Peterson',
      dob: '1980-04-12',
      gender: 'Male',
      mobile: docMobile,
      email: docEmail,
      registrationNumber: docRegNumber,
      qualification: 'MBBS, MD',
      university: 'Osmania Medical College',
      specialization: 'Cardiology',
      experienceYears: 12,
      hospitalAffiliation: 'Apex Health City',
      authorityType: 'State Medical Council',
      authority: 'Telangana State Medical Council',
      registrationState: 'Telangana',
      certificates: [], // Empty certificates
    }),
  });
  assert(failDocRes.status === 400, 'Doctor registration fails without mandatory certificates');

  // Test 2b: Register with all 3 mandatory certificates
  const docRegRes = await req('/auth/doctor/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Dr. Joe Peterson',
      dob: '1980-04-12',
      gender: 'Male',
      mobile: docMobile,
      email: docEmail,
      address: 'Road No 36, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      doctorIdNumber: 'NMC-DOC-55012',
      registrationNumber: docRegNumber,
      qualification: 'MBBS, MD (Cardiology)',
      university: 'Osmania Medical College',
      specialization: 'Cardiology',
      experienceYears: 12,
      hospitalAffiliation: 'Apex Health City',
      department: 'Cardiology',
      authorityType: 'State Medical Council',
      authority: 'Telangana State Medical Council',
      registrationState: 'Telangana',
      certificates: [
        { name: 'Medical Degree Certificate (MBBS, MD)', hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', fileName: 'MBBS_MD_Certificate.pdf' },
        { name: 'Medical Registration Certificate', hash: 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1', fileName: 'TS_Medical_Council_License.pdf' },
        { name: 'Government Identity Document', hash: 'c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2', fileName: 'Govt_Aadhaar_Card.pdf' },
      ],
      uploadedLicenseHash: 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1',
    }),
  });

  assert(docRegRes.status === 201 && docRegRes.data.success, 'Doctor registration succeeded with all 3 mandatory certificates');
  assert(docRegRes.data.status === 'PENDING', 'Doctor status is initially PENDING');
  const doctorApplicationId = docRegRes.data.applicationId;
  const registeredDoctor = docRegRes.data.doctor;
  const registeredDoctorId = registeredDoctor.id;
  console.log(`    Registered Doctor: Dr. Joe Peterson | Application: ${doctorApplicationId} | RegNo: ${docRegNumber}`);

  // ----------------------------------------------------
  // STEP 3: ADMIN LOGIN & APPROVAL -> GENERATE RANDOM TEMP PASSWORD
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Admin Review & Generate Random Temporary Password ---');
  const adminLoginRes = await req('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@emr-platform.internal',
      password: 'Admin@Secure2026!',
    }),
  });
  assert(adminLoginRes.status === 200 && adminLoginRes.data.token, 'Admin authenticated successfully');
  const adminToken = adminLoginRes.data.token;

  // Admin approves doctor
  const verifyRes = await req(`/admin/doctors/${registeredDoctorId}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      action: 'APPROVE',
      notes: 'All credentials verified against state medical registry. Approved.',
    }),
  });

  assert(verifyRes.status === 200 && verifyRes.data.success, 'Admin approved doctor registration');
  assert(verifyRes.data.temporaryPassword && verifyRes.data.temporaryPassword.length >= 8, 'System generated secure random temporary password');
  const tempPassword = verifyRes.data.temporaryPassword;
  console.log(`    System Generated Temporary Password: ${tempPassword}`);

  // ----------------------------------------------------
  // STEP 4: FIRST DOCTOR LOGIN WITH TEMPORARY PASSWORD
  // ----------------------------------------------------
  console.log('\n--- TEST 4: First Doctor Login & Mandatory Password Change ---');
  const firstLoginRes = await req('/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: docRegNumber,
      password: tempPassword,
    }),
  });

  assert(firstLoginRes.status === 200 && firstLoginRes.data.success, 'Doctor logged in with temporary password');
  assert(firstLoginRes.data.mustChangePassword === true, 'mustChangePassword flag is true');
  const doctorToken = firstLoginRes.data.token;

  // Doctor changes password
  const newDoctorPassword = 'DrJoe@Secure2026!';
  const changePwdRes = await req('/auth/doctor/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      currentPassword: tempPassword,
      newPassword: newDoctorPassword,
      confirmPassword: newDoctorPassword,
    }),
  });

  assert(changePwdRes.status === 200 && changePwdRes.data.success, 'Doctor changed temporary password to permanent password');

  // Test 4b: Old temporary password no longer works
  const oldPwdLoginRes = await req('/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: docRegNumber,
      password: tempPassword,
    }),
  });
  assert(oldPwdLoginRes.status === 401, 'Old temporary password is now invalid');

  // Test 4c: Future login with new permanent password
  const futureLoginRes = await req('/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: docRegNumber,
      password: newDoctorPassword,
    }),
  });

  assert(futureLoginRes.status === 200 && futureLoginRes.data.success, 'Doctor logged in with new permanent password');
  assert(futureLoginRes.data.mustChangePassword === false, 'mustChangePassword is now false');
  const activeDoctorToken = futureLoginRes.data.token;
  const loggedInDoctor = futureLoginRes.data.doctor || futureLoginRes.data.user.doctor;
  assert(loggedInDoctor.fullName === 'Dr. Joe Peterson', 'Authenticated doctor identity matches Dr. Joe Peterson');
  console.log(`    Doctor Auth Verified: ${loggedInDoctor.fullName} (${loggedInDoctor.registrationNumber})`);

  // ----------------------------------------------------
  // STEP 5: REAL PATIENT SEARCH BY 4 DIFFERENT TYPES
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Real Patient Database Search (Identity-Only) ---');

  // 5a: Health ID Search
  const searchHealthIdRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
    body: JSON.stringify({
      query: patientHealthId,
      searchType: 'healthId',
    }),
  });

  assert(searchHealthIdRes.status === 200 && searchHealthIdRes.data.patients.length === 1, `Search by Health ID (${patientHealthId}) resolved real patient`);
  const foundPatient = searchHealthIdRes.data.patients[0];
  assert(foundPatient.fullName === 'Kalyan Kumar', 'Found patient name is Kalyan Kumar');
  assert(foundPatient.bloodGroup === undefined && foundPatient.allergies === undefined, 'Search result is strictly identity-only (No clinical data before consent)');
  assert(foundPatient.identificationMarks && foundPatient.identificationMarks.length > 0, 'Identification marks are returned in identity preview');

  // 5b: Full Name Search (Case-insensitive & partial)
  const searchNameRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
    body: JSON.stringify({
      query: 'kalyan',
      searchType: 'fullName',
    }),
  });
  assert(searchNameRes.status === 200 && searchNameRes.data.patients.some(p => p.healthId === patientHealthId), 'Search by partial name "kalyan" resolved patient');

  // 5c: Aadhaar Search
  const searchAadhaarRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
    body: JSON.stringify({
      query: '998877665544',
      searchType: 'aadhaar',
    }),
  });
  assert(searchAadhaarRes.status === 200 && searchAadhaarRes.data.patients.some(p => p.healthId === patientHealthId), 'Search by Aadhaar resolved patient securely');

  // 5d: ABHA ID Search
  const searchAbhaRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
    body: JSON.stringify({
      query: 'kalyan@abdm',
      searchType: 'abhaId',
    }),
  });
  assert(searchAbhaRes.status === 200 && searchAbhaRes.data.patients.some(p => p.healthId === patientHealthId), 'Search by ABHA ID resolved patient');

  // 5e: Non-existent Patient Search
  const searchInvalidRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
    body: JSON.stringify({
      query: 'HP-999999999',
      searchType: 'healthId',
    }),
  });
  assert(searchInvalidRes.status === 200 && searchInvalidRes.data.patients.length === 0, 'Invalid search returns empty list with zero mock fallback');

  // ----------------------------------------------------
  // STEP 6: NORMAL ACCESS REQUEST & PATIENT CONSENT WORKFLOW
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Normal Access Request & Sovereign Consent ---');

  // 6a: Doctor tries to access EMR BEFORE consent -> MUST FAIL (403)
  const prematureEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
  });
  assert(prematureEmrRes.status === 403, 'Doctor denied EMR access before consent is approved (403 Forbidden)');

  // 6b: Doctor sends Access Request
  const accessReqRes = await req('/doctors/access-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
    body: JSON.stringify({
      healthId: patientHealthId,
      reason: 'Routine cardiology consultation and review of vitals',
      scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'ALLERGIES', 'CONDITIONS', 'MEDICINES'],
      requestedDuration: '2d',
    }),
  });

  assert(accessReqRes.status === 201 && accessReqRes.data.success, 'Access request created and sent to patient');
  const accessRequestId = accessReqRes.data.accessRequest.id;

  // 6c: Patient checks notification and active access requests
  const patientPermsRes = await req('/patients/me/access-permissions', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(patientPermsRes.status === 200, 'Patient fetched access requests');
  const patientRequests = patientPermsRes.data.requests || [];
  const foundRequest = patientRequests.find(r => r.id === accessRequestId);
  assert(foundRequest && foundRequest.status === 'PENDING', 'Patient sees pending access request from Dr. Joe Peterson');

  // 6d: Patient Approves Access Request
  const approveRes = await req(`/patients/me/access-requests/${accessRequestId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'ALLERGIES', 'CONDITIONS', 'MEDICINES'],
      durationDays: 2,
    }),
  });

  assert(approveRes.status === 200 && approveRes.data.success, 'Patient approved access request');
  const permissionId = approveRes.data.permission?.id;

  // 6e: Doctor now accesses authorized EMR
  const authorizedEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
  });

  assert(authorizedEmrRes.status === 200 && authorizedEmrRes.data.success, 'Doctor successfully accessed permitted EMR after approval');
  assert(authorizedEmrRes.data.patient.allergies.some(a => a.allergen.includes('Penicillin')), 'Doctor can view patient clinical allergies');
  assert(authorizedEmrRes.data.accessMode === 'AUTHORIZED_CONSENT', 'Access mode is AUTHORIZED_CONSENT');

  // 6f: Patient Revokes Permission
  const revokeRes = await req(`/patients/me/permissions/${permissionId}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ reason: 'Consultation concluded' }),
  });
  assert(revokeRes.status === 200 && revokeRes.data.success, 'Patient revoked doctor permission');

  // 6g: Doctor tries accessing EMR after revocation -> MUST FAIL (403)
  const postRevokeEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
  });
  assert(postRevokeEmrRes.status === 403, 'Doctor immediately loses access after patient revokes permission (403 Forbidden)');

  // ----------------------------------------------------
  // STEP 7: EMERGENCY ACCESS WORKFLOW (EXACTLY 2 HOURS)
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Emergency Access Protocol (2-Hour Limited Scope) ---');

  // 7a: Emergency initiation missing required fields -> FAIL
  const failEmsRes = await req('/doctors/emergency/initiate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
    body: JSON.stringify({
      healthId: patientHealthId,
      // Missing reason, condition, confirmation
    }),
  });
  assert(failEmsRes.status === 400, 'Emergency access denied when mandatory fields/confirmation are missing');

  // 7b: Valid Emergency Initiation
  const emsRes = await req('/doctors/emergency/initiate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
    body: JSON.stringify({
      healthId: patientHealthId,
      reason: 'Patient unconscious after acute motor vehicle collision',
      condition: 'Severe trauma, unresponsive',
      confirmation: true,
    }),
  });

  assert((emsRes.status === 200 || emsRes.status === 201) && emsRes.data.success, 'Emergency Level-1 session successfully initiated');
  const emsSession = emsRes.data.session;
  const emsExpiry = new Date(emsSession.autoExpiryTime);
  const emsStart = new Date(emsSession.startTime);
  const hoursDiff = (emsExpiry.getTime() - emsStart.getTime()) / (1000 * 60 * 60);
  assert(Math.abs(hoursDiff - 2) < 0.01, 'Emergency session duration is EXACTLY 2 HOURS');
  assert(emsRes.data.patient.bloodGroup === 'O+', 'Emergency access reveals critical blood group');
  assert(emsRes.data.patient.allergies.length > 0, 'Emergency access reveals critical drug allergies');

  // 7c: Doctor accesses EMR under Emergency Session
  const emsEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
  });
  assert(emsEmrRes.status === 200 && emsEmrRes.data.accessMode === 'EMERGENCY_OVERRIDE', 'Doctor accesses EMR under EMERGENCY_OVERRIDE mode');

  // 7d: Doctor appends Emergency Treatment Note
  const noteRes = await req(`/doctors/emergency/${emsSession.id}/note`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
    body: JSON.stringify({ note: 'Administered 500ml Ringer Lactate IV. Vitals stabilized at 120/80.' }),
  });
  assert(noteRes.status === 200 && noteRes.data.success, 'Emergency treatment note appended');

  // 7e: End Emergency Session
  const endEmsRes = await req(`/doctors/emergency/${emsSession.id}/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
  });
  assert(endEmsRes.status === 200 && endEmsRes.data.success, 'Emergency session concluded and sealed');

  // 7f: Accessing EMR after emergency session ends -> MUST FAIL (403)
  const postEmsEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${activeDoctorToken}` },
  });
  assert(postEmsEmrRes.status === 403, 'Doctor loses access after emergency session ends (403 Forbidden)');

  // ----------------------------------------------------
  // STEP 8: CROSS-PATIENT & CROSS-DOCTOR SECURITY ISOLATION
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Cross-Patient Security Isolation ---');

  // Register another doctor (Dr. Smith)
  const doc2Mobile = '98493' + Math.floor(10000 + Math.random() * 90000);
  const doc2Email = `dr.smith.${Date.now()}@apexcare.in`;
  const doc2RegNumber = `TSMC-${Math.floor(100000 + Math.random() * 900000)}`;

  const doc2RegRes = await req('/auth/doctor/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Dr. Sarah Smith',
      dob: '1985-09-20',
      gender: 'Female',
      mobile: doc2Mobile,
      email: doc2Email,
      registrationNumber: doc2RegNumber,
      qualification: 'MBBS, MS',
      university: 'Gandhi Medical College',
      specialization: 'Neurology',
      authorityType: 'State Medical Council',
      authority: 'Telangana State Medical Council',
      registrationState: 'Telangana',
      certificates: [
        { name: 'Degree Certificate', hash: 'hash1', fileName: 'cert.pdf' },
        { name: 'Registration Certificate', hash: 'hash2', fileName: 'reg.pdf' },
        { name: 'Govt ID', hash: 'hash3', fileName: 'id.pdf' },
      ],
      uploadedLicenseHash: 'hash2',
    }),
  });

  const doc2Id = doc2RegRes.data.doctor.id;
  const doc2VerifyRes = await req(`/admin/doctors/${doc2Id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ action: 'APPROVE' }),
  });
  const doc2TempPwd = doc2VerifyRes.data.temporaryPassword;

  const doc2LoginRes = await req('/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: doc2RegNumber, password: doc2TempPwd }),
  });
  const doc2Token = doc2LoginRes.data.token;

  // Dr. Smith tries to access Kalyan Kumar's EMR without permission
  const unauthorizedCrossRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doc2Token}` },
  });
  assert(unauthorizedCrossRes.status === 403, 'Dr. Smith cannot access Kalyan Kumar EMR without permission (403 Forbidden)');

  console.log('\n====================================================');
  console.log(`WORKFLOW TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running workflow tests:', err);
  process.exit(1);
});
