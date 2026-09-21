import { createRequire } from 'module';
const require = createRequire(import.meta.url);

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

async function runFullE2ETest() {
  console.log('========================================================================');
  console.log('APEX EMR — COMPREHENSIVE DOCTOR ACCESS & PATIENT SYNC E2E TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function assert(condition, testName, extraDetail = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      testResults.push({ name: testName, status: 'PASS', detail: extraDetail });
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${extraDetail ? `(${extraDetail})` : ''}`);
      testResults.push({ name: testName, status: 'FAIL', detail: extraDetail });
      failed++;
    }
  }

  // ------------------------------------------------------------------------
  // STEP 1: PATIENT REGISTRATION (Real PostgreSQL)
  // ------------------------------------------------------------------------
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
      allergies: 'Penicillin (Severe anaphylaxis)',
      conditions: 'Essential Hypertension',
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

  // ------------------------------------------------------------------------
  // STEP 2: DOCTOR REGISTRATION & ADMIN APPROVAL
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 2: Doctor Registration & Verification ---');
  const docMobile = '98492' + Math.floor(10000 + Math.random() * 90000);
  const docEmail = `dr.joe.${Date.now()}@apexcare.in`;
  const docRegNumber = `TSMC-${Math.floor(100000 + Math.random() * 900000)}`;

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

  assert(docRegRes.status === 201 && docRegRes.data.success, 'Doctor registration succeeded with mandatory certificates');
  const registeredDoctor = docRegRes.data.doctor;
  const registeredDoctorId = registeredDoctor.id;

  // Admin approves doctor
  const adminLoginRes = await req('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@emr-platform.internal',
      password: 'Admin@Secure2026!',
    }),
  });
  assert(adminLoginRes.status === 200 && adminLoginRes.data.token, 'Admin authenticated successfully');
  const adminToken = adminLoginRes.data.token;

  const verifyRes = await req(`/admin/doctors/${registeredDoctorId}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      action: 'APPROVE',
      notes: 'All credentials verified against state medical registry. Approved.',
    }),
  });
  assert(verifyRes.status === 200 && verifyRes.data.success, 'Admin approved doctor registration');
  const tempPassword = verifyRes.data.temporaryPassword;

  // Doctor first login and password change
  const firstLoginRes = await req('/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: docRegNumber,
      password: tempPassword,
    }),
  });
  assert(firstLoginRes.status === 200 && firstLoginRes.data.mustChangePassword === true, 'Doctor logged in with temporary password');

  const newDoctorPassword = 'DrJoe@Secure2026!';
  const changePwdRes = await req('/auth/doctor/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${firstLoginRes.data.token}` },
    body: JSON.stringify({
      currentPassword: tempPassword,
      newPassword: newDoctorPassword,
      confirmPassword: newDoctorPassword,
    }),
  });
  assert(changePwdRes.status === 200 && changePwdRes.data.success, 'Doctor successfully changed temporary password');

  // Authenticate doctor with permanent password
  const doctorLoginRes = await req('/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: docRegNumber,
      password: newDoctorPassword,
    }),
  });
  assert(doctorLoginRes.status === 200 && doctorLoginRes.data.success, 'Doctor authenticated with permanent password');
  const doctorToken = doctorLoginRes.data.token;
  const loggedInDoctor = doctorLoginRes.data.doctor || doctorLoginRes.data.user.doctor;
  assert(loggedInDoctor.fullName === 'Dr. Joe Peterson', 'Authenticated doctor profile matches Dr. Joe Peterson');

  // ------------------------------------------------------------------------
  // STEP 3: DOCTOR SEARCHES REAL PATIENT (IDENTITY-ONLY)
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 3: Doctor Patient Search (4 Search Types, Identity-Only) ---');
  // 3a. Health ID search
  const sHealthIdRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({ query: patientHealthId, searchType: 'healthId' }),
  });
  assert(sHealthIdRes.status === 200 && sHealthIdRes.data.patients.length === 1, 'Search by Health ID returned patient');
  const foundPat = sHealthIdRes.data.patients[0];
  assert(foundPat.fullName === 'Kalyan Kumar', 'Search result patient name is Kalyan Kumar');
  assert(foundPat.bloodGroup === undefined && foundPat.allergies === undefined, 'Search result strictly conceals clinical data before consent');
  assert(foundPat.accessStatus === 'ACCESS_REQUIRED', 'Initial patient accessStatus is ACCESS_REQUIRED');

  // 3b. Name search (partial & case-insensitive)
  const sNameRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({ query: 'kalyan', searchType: 'fullName' }),
  });
  assert(sNameRes.status === 200 && sNameRes.data.patients.some(p => p.healthId === patientHealthId), 'Search by partial name "kalyan" resolved patient');

  // 3c. Aadhaar search
  const sAadhaarRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({ query: '998877665544', searchType: 'aadhaar' }),
  });
  assert(sAadhaarRes.status === 200 && sAadhaarRes.data.patients.some(p => p.healthId === patientHealthId), 'Search by Aadhaar number resolved patient');

  // 3d. ABHA ID search
  const sAbhaRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({ query: 'kalyan@abdm', searchType: 'abhaId' }),
  });
  assert(sAbhaRes.status === 200 && sAbhaRes.data.patients.some(p => p.healthId === patientHealthId), 'Search by ABHA ID resolved patient');

  // ------------------------------------------------------------------------
  // STEP 4: PREMATURE ACCESS REJECTION & REQUEST CREATION
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 4: EMR Access Request Creation & Notification ---');
  // 4a. Doctor tries accessing EMR before consent -> MUST FAIL (403)
  const prematureEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(prematureEmrRes.status === 403, 'Doctor denied EMR access before consent (403 Forbidden)');

  // 4b. Doctor submits Access Request
  const createReqRes = await req('/doctors/access-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      healthId: patientHealthId,
      reason: 'Hypertension follow-up and cardiology consultation',
      scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'ALLERGIES', 'CONDITIONS', 'MEDICINES', 'LAB_REPORTS'],
      requestedDuration: '3d',
    }),
  });
  assert(createReqRes.status === 201 && createReqRes.data.success, 'Doctor submitted Access Request in PostgreSQL');
  const accessRequest = createReqRes.data.accessRequest;
  const accessRequestId = accessRequest.id;
  assert(accessRequest.status === 'PENDING', 'AccessRequest initial status is PENDING');

  // ------------------------------------------------------------------------
  // STEP 5: PATIENT NOTIFICATION & REVIEW
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 5: Patient Notification & Review Modal Verification ---');
  // 5a. Patient fetches notifications
  const patNotifRes = await req('/patients/me/notifications', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(patNotifRes.status === 200, 'Patient fetched notifications');
  const notifications = patNotifRes.data.notifications || [];
  const accessNotif = notifications.find(n => n.type === 'ACCESS_REQUEST' || n.category === 'ACCESS_REQUEST');
  assert(!!accessNotif, 'Patient received real PostgreSQL notification for doctor access request');
  assert(accessNotif.isRead === false, 'Notification is initially UNREAD (isRead = false)');
  assert(accessNotif.linkRoute && accessNotif.linkRoute.includes(accessRequestId), 'Notification linkRoute points to actual access request ID');

  // 5b. Patient opens/reads notification -> isRead = true, AccessRequest remains PENDING
  const markReadRes = await req(`/patients/me/notifications/${accessNotif.id}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(markReadRes.status === 200, 'Notification marked as read');

  // 5c. Patient fetches access permissions
  const patPermsRes = await req('/patients/me/access-permissions', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(patPermsRes.status === 200, 'Patient fetched access permissions list');
  const pendingRequests = (patPermsRes.data.requests || []).filter(r => r.status === 'PENDING');
  const approvedPermsBefore = (patPermsRes.data.permissions || []).filter(p => p.status === 'ACTIVE');
  assert(pendingRequests.some(r => r.id === accessRequestId), 'Access request is in PENDING state');
  console.log(`    Before approval: Pending Count = ${pendingRequests.length}, Approved Count = ${approvedPermsBefore.length}`);

  // ------------------------------------------------------------------------
  // STEP 6: PATIENT APPROVES ACCESS REQUEST
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 6: Patient Sovereign Approval & Permission Activation ---');
  const approveRes = await req(`/patients/me/access-requests/${accessRequestId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'ALLERGIES', 'CONDITIONS', 'MEDICINES', 'LAB_REPORTS'],
      durationDays: 3,
    }),
  });
  assert(approveRes.status === 200 && approveRes.data.success, 'Patient approved access request');
  const permission = approveRes.data.permission;
  const permissionId = permission.id;
  assert(permission.status === 'ACTIVE', 'Permission status is ACTIVE');
  assert(approveRes.data.accessRequest.status === 'APPROVED', 'AccessRequest status updated to APPROVED');

  // 6b. Verify DB counts after approval: Pending decreased, Approved increased
  const patPermsAfterRes = await req('/patients/me/access-permissions', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const pendingRequestsAfter = (patPermsAfterRes.data.requests || []).filter(r => r.status === 'PENDING');
  const approvedPermsAfter = (patPermsAfterRes.data.permissions || []).filter(p => p.status === 'ACTIVE');
  assert(!pendingRequestsAfter.some(r => r.id === accessRequestId), 'Approved request is no longer in PENDING list');
  assert(approvedPermsAfter.some(p => p.id === permissionId), 'New Permission is active in APPROVED list');
  console.log(`    After approval: Pending Count = ${pendingRequestsAfter.length}, Approved Count = ${approvedPermsAfter.length}`);

  // ------------------------------------------------------------------------
  // STEP 7: DOCTOR NOTIFICATION & AUTHORIZED PATIENT SEARCH
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 7: Doctor Notification & Authorized Search UI State ---');
  // 7a. Doctor fetches notifications
  const docDashRes = await req('/doctors/dashboard', {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(docDashRes.status === 200, 'Doctor fetched dashboard');

  // 7b. Doctor searches patient again -> MUST show AUTHORIZED, NO request button
  const sAuthorizedRes = await req('/doctors/patients/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({ query: patientHealthId, searchType: 'healthId' }),
  });
  assert(sAuthorizedRes.status === 200 && sAuthorizedRes.data.patients.length === 1, 'Search returned patient');
  const authPatientPreview = sAuthorizedRes.data.patients[0];
  assert(authPatientPreview.accessStatus === 'AUTHORIZED', 'Patient accessStatus is AUTHORIZED');
  assert(authPatientPreview.activePermission && authPatientPreview.activePermission.status === 'ACTIVE', 'Active permission object attached to search preview');

  // ------------------------------------------------------------------------
  // STEP 8: DOCTOR OPENS AUTHORIZED EMR
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 8: Doctor Opens Authorized EMR ---');
  const emrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(emrRes.status === 200 && emrRes.data.success, 'Doctor successfully loaded patient EMR');
  assert(emrRes.data.accessMode === 'AUTHORIZED_CONSENT', 'EMR accessMode is AUTHORIZED_CONSENT');
  assert(emrRes.data.patient.allergies.length > 0, 'Doctor can view patient clinical allergies');
  assert(emrRes.data.patient.bloodGroup === 'O+', 'Doctor can view patient blood group');

  // ------------------------------------------------------------------------
  // STEP 9: NEW CONSULTATION + PRESCRIPTION + MEDICINES + REPORTS
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 9: Doctor Records New Consultation & Prescription ---');
  const consultRes = await req('/doctors/consultations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      patientId,
      chiefComplaint: 'Chest tightness upon exertion and elevated home blood pressure readings',
      symptoms: 'Exertional dyspnea, mild headache in the mornings',
      observations: 'Chest clear, S1/S2 normal, no peripheral edema. Vitals BP 142/90 mmHg.',
      diagnosis: 'Stage 1 Essential Hypertension with Exertional Fatigue',
      treatmentPlan: 'Initiate Telmisartan 40mg once daily in morning. Low sodium DASH diet. Repeat lipid profile and fasting glucose.',
      clinicalNotes: 'Patient advised 30 minutes daily aerobic walking and to maintain a home BP journal.',
      followUpDate: '2026-10-18',
      vitals: {
        bloodPressure: '142/90',
        heartRate: '78',
        temperature: '98.4',
        spO2: '99',
        weight: '74',
      },
      recommendedLabTests: 'Serum Electrolytes, Fasting Lipid Panel, HbA1c',
      medicines: [
        {
          name: 'Telmisartan (Telma)',
          medicineName: 'Telmisartan',
          dosage: '40 mg',
          frequency: 'Once daily (1-0-0)',
          timingMorning: true,
          duration: '30 days',
          instructions: 'Take in the morning with a glass of water after breakfast',
        },
        {
          name: 'Amlodipine (Amlong)',
          medicineName: 'Amlodipine',
          dosage: '5 mg',
          frequency: 'Once daily at night (0-0-1)',
          timingNight: true,
          duration: '30 days',
          instructions: 'Take before bed if evening BP remains above 135/85',
        },
      ],
    }),
  });

  assert(consultRes.status === 201 && consultRes.data.success, 'Consultation recorded with blockchain cryptographic seal');
  const savedConsultation = consultRes.data.consultation;
  const savedPrescription = consultRes.data.prescription;
  assert(!!savedConsultation && savedConsultation.consultationNumber.startsWith('CON-'), 'Generated consultation number CON-xxxx');
  assert(!!savedPrescription && savedPrescription.prescriptionNumber.startsWith('RX-'), 'Generated linked prescription number RX-xxxx');

  // ------------------------------------------------------------------------
  // STEP 10: PATIENT SYNCHRONIZATION (Real PostgreSQL)
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 10: Patient Synchronization & Notification Verification ---');
  // 10a. Patient fetches consultations
  const patConsultsRes = await req('/patients/me/consultations', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(patConsultsRes.status === 200, 'Patient fetched consultations');
  const patConsults = patConsultsRes.data.consultations || [];
  assert(patConsults.some(c => c.id === savedConsultation.id), 'Patient sees new consultation in real-time');

  // 10b. Patient fetches prescriptions
  const patRxRes = await req('/patients/me/prescriptions', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(patRxRes.status === 200, 'Patient fetched prescriptions');
  const patRxList = patRxRes.data.prescriptions || [];
  assert(patRxList.some(p => p.id === savedPrescription.id), 'Patient sees new prescription in real-time');

  // 10c. Patient fetches medicines
  const patMedsRes = await req('/patients/me/medicines', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(patMedsRes.status === 200, 'Patient fetched active medicines');
  const patMeds = patMedsRes.data.medicines || [];
  assert(patMeds.some(m => m.medicineName.includes('Telmisartan')), 'Patient has Telmisartan active in medicine manager');
  assert(patMeds.some(m => m.medicineName.includes('Amlodipine')), 'Patient has Amlodipine active in medicine manager');

  // 10d. Patient fetches lab reports
  const patLabRes = await req('/patients/me/lab-reports', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(patLabRes.status === 200, 'Patient fetched lab reports');
  const patLabs = patLabRes.data.reports || patLabRes.data.labReports || [];
  assert(patLabs.some(l => l.testName.includes('Lipid') || l.testName.includes('Electrolytes')), 'Patient sees doctor-ordered diagnostic tests in lab reports');

  // 10e. Patient checks notifications
  const patNotifsAfterRes = await req('/patients/me/notifications', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const recentNotifs = patNotifsAfterRes.data.notifications || [];
  assert(recentNotifs.some(n => n.type === 'CONSULTATION'), 'Patient received New Consultation notification');
  assert(recentNotifs.some(n => n.type === 'PRESCRIPTION'), 'Patient received New Prescription notification');

  // ------------------------------------------------------------------------
  // STEP 11: AUDIT TRAIL VERIFICATION
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 11: Cryptographic Audit Trail Verification ---');
  const auditRes = await req('/patients/me/audit', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(auditRes.status === 200, 'Patient fetched audit events');
  const audits = auditRes.data.audits || [];
  assert(audits.some(a => a.action === 'CREATE' && a.documentType === 'ACCESS_PERMISSION'), 'Audit logged: Access request created');
  assert(audits.some(a => a.action === 'APPROVE' && a.documentType === 'ACCESS_PERMISSION'), 'Audit logged: Access approved');
  assert(audits.some(a => a.action === 'VIEW' && a.documentType === 'CONSULTATION'), 'Audit logged: Doctor viewed EMR');
  assert(audits.some(a => a.action === 'CREATE' && a.documentType === 'CONSULTATION'), 'Audit logged: Consultation created');
  assert(audits.some(a => a.action === 'CREATE' && a.documentType === 'PRESCRIPTION'), 'Audit logged: Prescription created');

  // ------------------------------------------------------------------------
  // STEP 12: CONSULTATION EDITING (While Active vs After Revoke)
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 12: Consultation Editing While Active ---');
  const editConsultRes = await req(`/doctors/consultations/${savedConsultation.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      clinicalNotes: 'Patient adhered to clinical regimen. Advised lifestyle modifications and periodic monitoring. BP well-controlled.',
    }),
  });
  assert(editConsultRes.status === 200 && editConsultRes.data.success, 'Doctor updated consultation while permission is ACTIVE');

  // ------------------------------------------------------------------------
  // STEP 13: PATIENT REVOKES ACCESS PERMISSION
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 13: Patient Revokes Permission & Immediate Access Loss ---');
  const revokeRes = await req(`/patients/me/permissions/${permissionId}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ reason: 'Consultation and treatment plan finalized' }),
  });
  assert(revokeRes.status === 200 && revokeRes.data.success, 'Patient revoked permission in PostgreSQL');

  // 13b. Doctor immediately loses EMR access (403)
  const postRevokeEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(postRevokeEmrRes.status === 403, 'Doctor immediately denied EMR access after revocation (403 Forbidden)');

  // 13c. Doctor cannot edit consultation after revocation (403)
  const postRevokeEditRes = await req(`/doctors/consultations/${savedConsultation.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({ clinicalNotes: 'Unauthorized post-revocation edit attempt' }),
  });
  assert(postRevokeEditRes.status === 403, 'Doctor cannot edit consultation after revocation (403 Forbidden)');

  // 13d. Doctor cannot create new consultation after revocation (403)
  const postRevokeCreateRes = await req('/doctors/consultations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      patientId,
      symptoms: 'Post revoke attempt',
      diagnosis: 'Unauthorized consultation',
      treatmentPlan: 'None',
    }),
  });
  assert(postRevokeCreateRes.status === 403, 'Doctor cannot record new consultation after revocation (403 Forbidden)');

  // ------------------------------------------------------------------------
  // STEP 14: REJECTION FLOW TEST
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 14: Rejection Workflow Test ---');
  const req2Res = await req('/doctors/access-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      healthId: patientHealthId,
      reason: 'Second opinion cardiology review',
      scopes: ['CONSULTATIONS', 'LAB_REPORTS'],
      requestedDuration: '1d',
    }),
  });
  assert(req2Res.status === 201, 'Second access request created');
  const req2Id = req2Res.data.accessRequest.id;

  const rejectRes = await req(`/patients/me/access-requests/${req2Id}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ reason: 'Second opinion not required at this time' }),
  });
  assert(rejectRes.status === 200 && rejectRes.data.success, 'Patient rejected second access request');
  assert(rejectRes.data.accessRequest.status === 'REJECTED', 'AccessRequest status is REJECTED');

  const rejectEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(rejectEmrRes.status === 403, 'Doctor denied access after request rejection (403 Forbidden)');

  // ------------------------------------------------------------------------
  // STEP 15: EMERGENCY ACCESS BREAK-GLASS PROTOCOL (EXACTLY 2 HOURS)
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 15: Emergency Access Protocol (Exactly 2 Hours) ---');
  const emsRes = await req('/doctors/emergency/initiate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      healthId: patientHealthId,
      reason: 'Acute emergency: Patient unresponsive following vehicular accident',
      condition: 'Head trauma, hypotension',
      confirmation: true,
    }),
  });

  assert((emsRes.status === 200 || emsRes.status === 201) && emsRes.data.success, 'Emergency Level-1 session initiated');
  const emsSession = emsRes.data.session;
  const emsExpiry = new Date(emsSession.autoExpiryTime);
  const emsStart = new Date(emsSession.startTime);
  const diffHours = (emsExpiry.getTime() - emsStart.getTime()) / (1000 * 60 * 60);
  assert(Math.abs(diffHours - 2) < 0.01, 'Emergency session duration is EXACTLY 2 HOURS');
  assert(emsRes.data.patient.bloodGroup === 'O+', 'Emergency access exposes critical blood group (O+)');
  assert(emsRes.data.patient.allergies.length > 0, 'Emergency access exposes critical drug allergies');

  // 15b. Doctor accesses EMR under emergency override
  const emsEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(emsEmrRes.status === 200 && emsEmrRes.data.accessMode === 'EMERGENCY_OVERRIDE', 'Doctor accesses EMR under EMERGENCY_OVERRIDE');

  // 15c. Doctor adds emergency treatment note
  const emsNoteRes = await req(`/doctors/emergency/${emsSession.id}/note`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({ note: 'Administered IV fluids. Vitals stabilized.' }),
  });
  assert(emsNoteRes.status === 200 && emsNoteRes.data.success, 'Emergency treatment note appended');

  // 15d. End Emergency Session
  const endEmsRes = await req(`/doctors/emergency/${emsSession.id}/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(endEmsRes.status === 200 && endEmsRes.data.success, 'Emergency session concluded');

  // 15e. Accessing EMR after emergency ends -> MUST FAIL (403)
  const postEmsEmrRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(postEmsEmrRes.status === 403, 'Doctor loses access after emergency session ends (403 Forbidden)');

  // ------------------------------------------------------------------------
  // STEP 16: CROSS-PATIENT & CROSS-DOCTOR SECURITY
  // ------------------------------------------------------------------------
  console.log('\n--- TEST 16: Cross-Doctor & Cross-Patient Security Isolation ---');
  // Register Dr. Smith
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
        { name: 'Degree Certificate', hash: 'h1', fileName: 'cert.pdf' },
        { name: 'Registration Certificate', hash: 'h2', fileName: 'reg.pdf' },
        { name: 'Govt ID', hash: 'h3', fileName: 'id.pdf' },
      ],
      uploadedLicenseHash: 'h2',
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
  const unauthCrossRes = await req(`/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doc2Token}` },
  });
  assert(unauthCrossRes.status === 403, 'Dr. Smith cannot access Kalyan Kumar EMR without consent (403 Forbidden)');

  console.log('\n========================================================================');
  console.log(`FINAL E2E WORKFLOW TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFullE2ETest().catch((err) => {
  console.error('Fatal E2E test execution error:', err);
  process.exit(1);
});
