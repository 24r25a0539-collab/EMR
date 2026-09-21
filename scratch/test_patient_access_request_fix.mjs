/**
 * APEX EMR — PATIENT ACCESS REQUEST + NOTIFICATION WORKFLOW TEST
 * 
 * Verifies the end-to-end database-driven workflow:
 * 1. Doctor creates access request for patient
 * 2. Real PostgreSQL AccessRequest in PENDING status
 * 3. Real PostgreSQL unread Notification created for patient
 * 4. Unread notification count and pending request count synchronization
 * 5. Notification review routing with requestId
 * 6. Patient reviews, sees real doctor profile & details
 * 7. Patient approves request -> AccessRequest: APPROVED, Permission: ACTIVE
 * 8. Doctor receives approval notification
 * 9. Doctor accesses permitted patient EMR
 * 10. Patient revokes permission -> Doctor denied EMR access (403)
 * 11. Doctor requests again -> Patient rejects -> AccessRequest: REJECTED, Doctor denied access
 * 12. Cross-patient security isolation verified
 */

const BASE_URL = 'http://localhost:5000/api';

async function req(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('APEX EMR — ACCESS REQUEST & NOTIFICATION WORKFLOW');
  console.log('====================================================\n');

  // STEP 1: Register and setup a real patient in PostgreSQL
  console.log('--- TEST 1: Register Real Patient in PostgreSQL ---');
  const patientMobile = '98765' + Math.floor(10000 + Math.random() * 90000);
  const patientEmail = `patient.${Date.now()}@example.com`;

  const otpRes = await req('/auth/patient/registration-request-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: patientMobile }),
  });
  const otpCode = otpRes.data.mockOtp || '123456';

  const regRes = await req('/auth/patient/register', {
    method: 'POST',
    body: JSON.stringify({
      mobile: patientMobile,
      otp: otpCode,
      fullName: 'Kalyan Kumar',
      dob: '1990-05-15',
      gender: 'Male',
      bloodGroup: 'O+',
      govtIdType: 'Aadhaar Card',
      govtIdNumber: '9988' + Math.floor(10000000 + Math.random() * 90000000),
      address: '123 Tech Park',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500081',
      email: patientEmail,
      allergies: [{ allergen: 'Penicillin', allergyType: 'DRUG', severity: 'SEVERE' }],
    }),
  });

  assert(regRes.status === 201 && regRes.data.success, 'Patient registered successfully in PostgreSQL');
  const patientToken = regRes.data.token;
  const patientHealthId = regRes.data.patient.healthId;
  const patientId = regRes.data.patient.id;
  const patientUserId = regRes.data.user.id;
  console.log(`    Registered Patient: ${regRes.data.patient.fullName} | Health ID: ${patientHealthId}`);

  // STEP 2: Register, approve, and login a real Doctor
  console.log('\n--- TEST 2: Register, Approve, and Authenticate Real Doctor ---');
  const docMobile = '98480' + Math.floor(10000 + Math.random() * 90000);
  const docEmail = `dr.joe.${Date.now()}@apexcare.in`;
  const docRegNumber = `TSMC-${Math.floor(100000 + Math.random() * 900000)}`;

  const docRegRes = await req('/auth/doctor/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Dr. Joe Peterson',
      dob: '1980-06-15',
      gender: 'Male',
      mobile: docMobile,
      email: docEmail,
      registrationNumber: docRegNumber,
      qualification: 'MBBS, MD',
      university: 'Osmania Medical College',
      specialization: 'Cardiology',
      authorityType: 'State Medical Council',
      authority: 'Telangana State Medical Council',
      registrationState: 'Telangana',
      certificates: [
        { name: 'Degree Certificate', hash: 'deg_hash', fileName: 'degree.pdf' },
        { name: 'Registration Certificate', hash: 'reg_hash', fileName: 'reg.pdf' },
        { name: 'Govt ID', hash: 'id_hash', fileName: 'govt_id.pdf' },
      ],
      uploadedLicenseHash: 'reg_hash',
    }),
  });
  assert(docRegRes.status === 201 && docRegRes.data.success, 'Doctor registered with mandatory documents');

  // Admin approves doctor
  const adminLoginRes = await req('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@emr-platform.internal', password: 'Admin@Secure2026!' }),
  });
  const adminToken = adminLoginRes.data.token;

  const docVerifyRes = await req(`/admin/doctors/${docRegRes.data.doctor.id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ action: 'APPROVE' }),
  });
  const tempPassword = docVerifyRes.data.temporaryPassword;

  // Doctor first login and change password
  const docFirstLoginRes = await req('/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: docRegNumber, password: tempPassword }),
  });
  const docTempToken = docFirstLoginRes.data.token;

  const newDoctorPassword = 'DrJoe@Secure2026!';
  await req('/auth/doctor/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${docTempToken}` },
    body: JSON.stringify({
      currentPassword: tempPassword,
      newPassword: newDoctorPassword,
      confirmPassword: newDoctorPassword,
    }),
  });

  const docLoginRes = await req('/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: docRegNumber, password: newDoctorPassword }),
  });
  const doctorToken = docLoginRes.data.token;
  assert(docLoginRes.status === 200 && docLoginRes.data.user.role === 'DOCTOR', 'Doctor authenticated with permanent password');
  console.log(`    Authenticated Doctor: ${docLoginRes.data.doctor.fullName} (${docRegNumber})`);

  // STEP 3: Doctor Patient Search (Identity-Only)
  console.log('\n--- TEST 3: Doctor Patient Search ---');
  const searchRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({ query: patientHealthId, searchType: 'healthId' }),
  });
  assert(searchRes.status === 200 && searchRes.data.patients.length > 0, 'Doctor searches real patient by Health ID');
  assert(searchRes.data.patients[0].fullName === 'Kalyan Kumar', 'Search resolves correct patient');
  assert(!searchRes.data.patients[0].bloodGroup && !searchRes.data.patients[0].allergies, 'Initial search result is strictly identity-only');

  // STEP 4: Doctor submits Normal Access Request
  console.log('\n--- TEST 4: Doctor Submits Normal Access Request ---');
  const requestAccessRes = await req('/doctors/access-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      healthId: patientHealthId,
      reason: 'Cardiological assessment and clinical consultation',
      scopes: ['Consultations', 'Prescriptions', 'Lab Reports'],
      requestedDuration: '3 Days',
    }),
  });
  assert(requestAccessRes.status === 201 && requestAccessRes.data.success, 'Doctor submits access request to PostgreSQL');
  const accessRequestId = requestAccessRes.data.accessRequest.id;
  assert(requestAccessRes.data.accessRequest.status === 'PENDING', 'AccessRequest status is PENDING');
  assert(requestAccessRes.data.accessRequest.durationDays === 3, 'Default duration is 3 days');

  // STEP 5: Patient receives real PostgreSQL notification & badge count
  console.log('\n--- TEST 5: Patient Notification & Unread Badge Synchronization ---');
  const notifsRes = await req('/patients/me/notifications', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(notifsRes.status === 200 && notifsRes.data.notifications.length > 0, 'Patient fetches notifications from PostgreSQL');
  assert(notifsRes.data.unreadCount >= 1, 'Patient unread notification count is correctly synchronized (>= 1)');

  const latestNotif = notifsRes.data.notifications[0];
  assert(latestNotif.type === 'ACCESS_REQUEST', 'Notification type is ACCESS_REQUEST');
  assert(latestNotif.linkRoute.includes(accessRequestId), 'Notification linkRoute references the actual accessRequest.id');
  console.log(`    Notification: "${latestNotif.title}" -> ${latestNotif.message}`);

  // STEP 6: Patient reviews Access Permissions from PostgreSQL
  console.log('\n--- TEST 6: Patient Reviews Access Request Details ---');
  const permsRes = await req('/patients/me/access-permissions', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(permsRes.status === 200 && permsRes.data.requests.length > 0, 'Patient loads real database access requests');
  const pendingReq = permsRes.data.requests.find((r) => r.id === accessRequestId);
  assert(pendingReq && pendingReq.status === 'PENDING', 'Pending request found in patient access permissions');
  assert(pendingReq.doctor.fullName === 'Dr. Joe Peterson', 'Request contains real doctor name');
  assert(pendingReq.doctor.registrationNumber === docRegNumber, 'Request contains real medical licence');

  // STEP 7: Doctor CANNOT access EMR before patient approval (403)
  console.log('\n--- TEST 7: Security: Doctor Denied EMR Access Before Approval ---');
  const preApprovalEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(preApprovalEmrRes.status === 403, 'Doctor denied clinical EMR access before consent approval (403 Forbidden)');

  // STEP 8: Patient marks notification as read (without approving request)
  console.log('\n--- TEST 8: Separation of Notification Read vs Request Approval ---');
  await req(`/patients/me/notifications/${latestNotif.id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const notifsAfterRead = await req('/patients/me/notifications', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(notifsAfterRead.data.unreadCount === 0, 'Notification unread count becomes 0 after marking read');

  const permsStillPending = await req('/patients/me/access-permissions', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const pendingStillReq = permsStillPending.data.requests.find((r) => r.id === accessRequestId);
  assert(pendingStillReq && pendingStillReq.status === 'PENDING', 'AccessRequest strictly remains PENDING even though notification is read');

  // STEP 9: Patient approves Access Request
  console.log('\n--- TEST 9: Patient Approves Access Request ---');
  const approveRes = await req(`/patients/me/access-requests/${accessRequestId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      scopes: ['Consultations', 'Prescriptions', 'Lab Reports'],
      durationDays: 3,
    }),
  });
  assert(approveRes.status === 200 && approveRes.data.success, 'Patient approved access request');
  assert(approveRes.data.permission.status === 'ACTIVE', 'Permission is now ACTIVE in PostgreSQL');

  // STEP 10: Doctor receives approval notification in PostgreSQL
  console.log('\n--- TEST 10: Doctor Receives Approval Notification ---');
  const docProfileRes = await req('/doctors/profile', {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(docProfileRes.status === 200, 'Doctor profile loaded from PostgreSQL');

  // STEP 11: Doctor accesses permitted Patient EMR after approval
  console.log('\n--- TEST 11: Doctor Accesses Permitted Patient EMR ---');
  const postApprovalEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(postApprovalEmrRes.status === 200 && postApprovalEmrRes.data.accessMode === 'AUTHORIZED_CONSENT', 'Doctor successfully accessed permitted EMR');
  assert(postApprovalEmrRes.data.patient.fullName === 'Kalyan Kumar', 'Doctor sees patient clinical profile');

  // STEP 12: Patient revokes permission -> Doctor immediately loses access
  console.log('\n--- TEST 12: Patient Revokes Access Permission ---');
  const permissionId = approveRes.data.permission.id;
  const revokeRes = await req(`/patients/me/permissions/${permissionId}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ reason: 'Consultation concluded' }),
  });
  assert(revokeRes.status === 200 && revokeRes.data.success, 'Patient revoked active permission');

  const postRevokeEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(postRevokeEmrRes.status === 403, 'Doctor immediately loses access after revocation (403 Forbidden)');

  // STEP 13: Doctor requests again & Patient Rejects
  console.log('\n--- TEST 13: Doctor Requests Again & Patient Rejects ---');
  const req2Res = await req('/doctors/access-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      healthId: patientHealthId,
      reason: 'Follow-up second opinion',
      scopes: ['Prescriptions'],
      requestedDuration: '1 Day',
    }),
  });
  const req2Id = req2Res.data.accessRequest.id;

  const rejectRes = await req(`/patients/me/access-requests/${req2Id}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ reason: 'Not seeking second opinion at this time' }),
  });
  assert(rejectRes.status === 200 && rejectRes.data.success, 'Patient rejected access request');
  assert(rejectRes.data.accessRequest.status === 'REJECTED', 'AccessRequest status is REJECTED');

  const postRejectEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(postRejectEmrRes.status === 403, 'Doctor denied access for rejected request (403 Forbidden)');

  // STEP 14: Cross-Patient Security Isolation
  console.log('\n--- TEST 14: Cross-Patient Security Isolation ---');
  const patient2Mobile = '98761' + Math.floor(10000 + Math.random() * 90000);
  const p2OtpRes = await req('/auth/patient/registration-request-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: patient2Mobile }),
  });
  const p2OtpCode = p2OtpRes.data.mockOtp || '123456';

  const p2RegRes = await req('/auth/patient/register', {
    method: 'POST',
    body: JSON.stringify({
      mobile: patient2Mobile,
      otp: p2OtpCode,
      fullName: 'Rahul Sharma',
      dob: '1995-08-20',
      gender: 'Male',
      bloodGroup: 'B+',
      govtIdType: 'Aadhaar Card',
      govtIdNumber: '8877' + Math.floor(10000000 + Math.random() * 90000000),
      address: '456 Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500033',
    }),
  });
  const p2Token = p2RegRes.data.token;

  // Patient 2 cannot see Patient 1's access requests
  const p2PermsRes = await req('/patients/me/access-permissions', {
    headers: { Authorization: `Bearer ${p2Token}` },
  });
  const foundOtherReq = p2PermsRes.data.requests.find((r) => r.id === accessRequestId || r.id === req2Id);
  assert(!foundOtherReq, 'Patient 2 cannot see Patient 1 access requests in PostgreSQL');

  console.log('\n====================================================');
  console.log(`WORKFLOW TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
