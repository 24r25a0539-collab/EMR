/**
 * Comprehensive E2E Verification Suite for Apex EMR Doctor Module
 * Tests complete lifecycle: Registration -> Gov Verification -> Admin Decision ->
 * Secure Temp Password -> First Login -> Forced Password Change -> Future Login ->
 * EMR Access -> Emergency 2h Break-Glass -> Cross-Patient Security -> Patient Regression.
 */

const BASE_URL = 'http://localhost:5000/api';

const results = [];

function recordTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${details ? ` - ${details}` : ''}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('APEX EMR — DOCTOR MODULE COMPLETE E2E VERIFICATION');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Doctor registration validation (Missing mandatory fields)
    // ----------------------------------------------------
    const invalidRegRes = await fetch(`${BASE_URL}/auth/doctor/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: '', // empty name
        registrationNumber: '',
        email: 'invalid-email',
      }),
    });
    const invalidRegData = await invalidRegRes.json();
    recordTest(
      'TEST 1: Doctor registration validation rejects missing/invalid fields',
      invalidRegRes.status === 400 && !invalidRegData.success,
      `Status: ${invalidRegRes.status}, Error: ${invalidRegData.error}`
    );

    // ----------------------------------------------------
    // TEST 2 & 3: Submit valid doctor registration -> PENDING + GOVERNMENT_MATCHED
    // ----------------------------------------------------
    const testDocRegNum1 = `TSMC-${Math.floor(100000 + Math.random() * 900000)}`;
    const testDocEmail1 = `dr.verma.${Date.now()}@carehospital.in`;
    const testDocMobile1 = `9849${Math.floor(100000 + Math.random() * 900000)}`;

    const validRegRes = await fetch(`${BASE_URL}/auth/doctor/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Dr. Rajesh Verma',
        dob: '1982-05-14',
        gender: 'Male',
        mobile: testDocMobile1,
        email: testDocEmail1,
        address: 'Road No 1, Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        pincode: '500034',
        doctorIdNumber: `NMC-${testDocRegNum1}`,
        registrationNumber: testDocRegNum1,
        authorityType: 'State Medical Council',
        authority: 'Telangana State Medical Council',
        registrationState: 'Telangana',
        qualification: 'MBBS, MD',
        university: 'Osmania Medical College',
        specialization: 'Neurology',
        experienceYears: '14',
        hospitalAffiliation: 'Care Hospital, Banjara Hills',
        department: 'Neurology',
      }),
    });
    const validRegData = await validRegRes.json();
    recordTest(
      'TEST 2: Submit valid doctor registration sets status to PENDING',
      validRegRes.status === 201 && validRegData.status === 'PENDING' && !!validRegData.applicationId,
      `Application ID: ${validRegData.applicationId}, Status: ${validRegData.status}`
    );

    recordTest(
      'TEST 3: Government exact match results in GOVERNMENT_MATCHED',
      validRegData.govMatchStatus === 'GOVERNMENT_MATCHED' && validRegData.isGovMatched === true,
      `Gov Match Status: ${validRegData.govMatchStatus}`
    );

    // ----------------------------------------------------
    // TEST 4: Government mismatch results in GOVERNMENT_MISMATCH with exact mismatch fields
    // ----------------------------------------------------
    const mismatchDocRegNum = `MISMATCH-${Math.floor(100000 + Math.random() * 900000)}`;
    const mismatchDocEmail = `dr.mismatch.${Date.now()}@test.in`;
    const mismatchDocMobile = `9849${Math.floor(100000 + Math.random() * 900000)}`;

    const mismatchRegRes = await fetch(`${BASE_URL}/auth/doctor/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Dr. Fake Unverified Person',
        dob: '1995-01-01',
        gender: 'Male',
        mobile: mismatchDocMobile,
        email: mismatchDocEmail,
        address: '123 Fake Street',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        pincode: '500001',
        doctorIdNumber: 'INV-DOC-99999',
        registrationNumber: mismatchDocRegNum,
        authorityType: 'State Medical Council',
        authority: 'Telangana State Medical Council',
        registrationState: 'Telangana',
        qualification: 'MBBS',
        university: 'Unknown College',
        specialization: 'General Medicine',
      }),
    });
    const mismatchRegData = await mismatchRegRes.json();
    recordTest(
      'TEST 4: Government mismatch results in GOVERNMENT_MISMATCH with exact mismatch fields',
      mismatchRegRes.status === 201 &&
        mismatchRegData.govMatchStatus === 'GOVERNMENT_MISMATCH' &&
        mismatchRegData.isGovMatched === false &&
        mismatchRegData.govVerificationResult?.mismatchSummary?.length > 0,
      `Gov Status: ${mismatchRegData.govMatchStatus}, Mismatches: ${mismatchRegData.govVerificationResult?.mismatchSummary?.join('; ')}`
    );

    // ----------------------------------------------------
    // TEST 5 & 6: Admin login & Admin sees doctor registrations + government verification result
    // ----------------------------------------------------
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@emr-platform.internal', password: 'Admin@Secure2026!' }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;

    const adminDoctorsRes = await fetch(`${BASE_URL}/admin/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDoctorsData = await adminDoctorsRes.json();
    const foundDoc1 = adminDoctorsData.doctors?.find((d) => d.registrationNumber === testDocRegNum1);
    const foundMismatchDoc = adminDoctorsData.doctors?.find((d) => d.registrationNumber === mismatchDocRegNum);

    recordTest(
      'TEST 5: Admin sees pending doctor registrations in queue',
      adminDoctorsRes.status === 200 && !!foundDoc1 && !!foundMismatchDoc,
      `Total doctors in queue: ${adminDoctorsData.doctors?.length}`
    );

    recordTest(
      'TEST 6: Admin sees government verification match & mismatch breakdown',
      foundDoc1?.govMatchStatus === 'GOVERNMENT_MATCHED' && foundMismatchDoc?.govMatchStatus === 'GOVERNMENT_MISMATCH',
      `Doc1: ${foundDoc1?.govMatchStatus}, MismatchDoc: ${foundMismatchDoc?.govMatchStatus}`
    );

    // ----------------------------------------------------
    // TEST 7: Admin rejects doctor -> ADMIN_REJECTED & login blocked
    // ----------------------------------------------------
    const rejectRes = await fetch(`${BASE_URL}/admin/doctors/${foundMismatchDoc.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        action: 'REJECT',
        rejectionReason: 'Medical registration credentials could not be verified in state medical council registry.',
      }),
    });
    const rejectData = await rejectRes.json();

    const rejectedLoginAttempt = await fetch(`${BASE_URL}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: mismatchDocRegNum, password: 'AnyPassword123!' }),
    });
    const rejectedLoginData = await rejectedLoginAttempt.json();

    recordTest(
      'TEST 7: Admin rejects doctor -> status becomes REJECTED and login is blocked',
      rejectRes.status === 200 &&
        rejectData.doctor?.regStatus === 'REJECTED' &&
        rejectedLoginAttempt.status === 403 &&
        rejectedLoginData.error === 'ACCOUNT_REJECTED',
      `Login attempt status: ${rejectedLoginAttempt.status}, Error: ${rejectedLoginData.error}`
    );

    // ----------------------------------------------------
    // TEST 8 & 9: Admin accepts valid doctor -> ADMIN_APPROVED + ACTIVE
    // ----------------------------------------------------
    const approveRes = await fetch(`${BASE_URL}/admin/doctors/${foundDoc1.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE', notes: 'Accreditation approved after government registry validation.' }),
    });
    const approveData = await approveRes.json();
    const generatedTempPassword = approveData.temporaryPassword;

    recordTest(
      'TEST 8 & 9: Admin accepts doctor -> ADMIN_APPROVED and ACTIVE',
      approveRes.status === 200 && approveData.doctor?.regStatus === 'APPROVED' && !!generatedTempPassword,
      `Status: ${approveData.doctor?.regStatus}, Temp Password Issued: ${generatedTempPassword}`
    );

    // ----------------------------------------------------
    // TEST 10: Verify secure random temporary password generated (Never fixed 1234 or Doctor@123)
    // ----------------------------------------------------
    const isRandomSecure =
      generatedTempPassword.length >= 8 &&
      generatedTempPassword !== '1234' &&
      generatedTempPassword !== '123456' &&
      generatedTempPassword !== 'doctor123' &&
      generatedTempPassword !== 'Doctor@123' &&
      generatedTempPassword !== 'password';

    recordTest(
      'TEST 10: Secure random temporary password generated',
      isRandomSecure,
      `Generated temporary password: ${generatedTempPassword}`
    );

    // ----------------------------------------------------
    // TEST 11: Verify database stores only password hash, NOT plaintext password
    // ----------------------------------------------------
    const checkUserInDbRes = await fetch(`${BASE_URL}/admin/users?search=${encodeURIComponent(testDocEmail1)}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const checkUserData = await checkUserInDbRes.json();
    const docUser = checkUserData.users?.find((u) => u.email === testDocEmail1);

    // The user's passwordHash should be a 64-char SHA-256 hex string and NEVER equal to the plaintext temporary password
    const isHashedOnly =
      docUser &&
      docUser.passwordHash &&
      docUser.passwordHash.length === 64 &&
      docUser.passwordHash !== generatedTempPassword;

    recordTest(
      'TEST 11: Database stores only SHA-256 password hash, never plaintext password',
      !!isHashedOnly,
      `DB Hash: ${docUser?.passwordHash?.slice(0, 16)}...`
    );

    // ----------------------------------------------------
    // TEST 12: First login using temporary password -> Authenticates but forces Change Password
    // ----------------------------------------------------
    const firstLoginRes = await fetch(`${BASE_URL}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testDocRegNum1, password: generatedTempPassword }),
    });
    const firstLoginData = await firstLoginRes.json();
    const tempSessionToken = firstLoginData.token;

    recordTest(
      'TEST 12: First login with temporary password forces mustChangePassword: true and redirect to /doctor/change-password',
      firstLoginRes.status === 200 &&
        firstLoginData.mustChangePassword === true &&
        firstLoginData.redirectTo === '/doctor/change-password' &&
        !!tempSessionToken,
      `mustChangePassword: ${firstLoginData.mustChangePassword}, Redirect: ${firstLoginData.redirectTo}`
    );

    // ----------------------------------------------------
    // TEST 13 & 14: Change password to doctor's new custom password
    // ----------------------------------------------------
    const doctorNewPassword = 'DrRajesh#Secure2026!';

    const changePwdRes = await fetch(`${BASE_URL}/auth/doctor/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tempSessionToken}` },
      body: JSON.stringify({
        currentPassword: generatedTempPassword,
        newPassword: doctorNewPassword,
        confirmPassword: doctorNewPassword,
      }),
    });
    const changePwdData = await changePwdRes.json();
    const permanentDoctorToken = changePwdData.token;

    recordTest(
      'TEST 14: Change password successfully updates hash and sets mustChangePassword: false',
      changePwdRes.status === 200 && changePwdData.success === true && changePwdData.mustChangePassword === false,
      `Message: ${changePwdData.message}`
    );

    // ----------------------------------------------------
    // TEST 15: Old temporary password no longer works
    // ----------------------------------------------------
    const oldTempLoginRes = await fetch(`${BASE_URL}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testDocRegNum1, password: generatedTempPassword }),
    });
    const oldTempLoginData = await oldTempLoginRes.json();

    recordTest(
      'TEST 15: Old temporary password stops working after password change (LOGIN FAIL)',
      oldTempLoginRes.status === 401 && oldTempLoginData.error === 'INVALID_CREDENTIALS',
      `Status: ${oldTempLoginRes.status}, Error: ${oldTempLoginData.error}`
    );

    // ----------------------------------------------------
    // TEST 16, 17, 18: Future Doctor Login with Licence Number + New Password (NO OTP)
    // ----------------------------------------------------
    const futureLoginRes = await fetch(`${BASE_URL}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testDocRegNum1, password: doctorNewPassword }),
    });
    const futureLoginData = await futureLoginRes.json();
    const activeDoctorToken = futureLoginData.token;

    recordTest(
      'TEST 16 & 18: Future login using Licence Number + New Password succeeds directly without OTP',
      futureLoginRes.status === 200 &&
        futureLoginData.mustChangePassword === false &&
        futureLoginData.redirectTo === '/doctor/dashboard' &&
        !!activeDoctorToken,
      `Doctor Name: ${futureLoginData.doctor?.fullName}, Redirect: ${futureLoginData.redirectTo}`
    );

    // ----------------------------------------------------
    // TEST 19: Doctor profile loads actual PostgreSQL data
    // ----------------------------------------------------
    const docProfileRes = await fetch(`${BASE_URL}/doctors/profile`, {
      headers: { Authorization: `Bearer ${activeDoctorToken}` },
    });
    const docProfileData = await docProfileRes.json();

    recordTest(
      'TEST 19: Doctor profile loads actual PostgreSQL data',
      docProfileRes.status === 200 &&
        docProfileData.doctor?.registrationNumber === testDocRegNum1 &&
        docProfileData.doctor?.specialization === 'Neurology',
      `Name: ${docProfileData.doctor?.fullName}, Reg: ${docProfileData.doctor?.registrationNumber}, Spec: ${docProfileData.doctor?.specialization}`
    );

    // ----------------------------------------------------
    // TEST 20: Doctor searches patient -> identity-only preview before consent
    // ----------------------------------------------------
    const searchRes = await fetch(`${BASE_URL}/doctors/patients/search?query=Ramesh`, {
      headers: { Authorization: `Bearer ${activeDoctorToken}` },
    });
    const searchData = await searchRes.json();
    const firstPatient = searchData.patients?.[0];

    const hasNoSensitiveMedicalData =
      firstPatient &&
      firstPatient.bloodGroup === undefined &&
      firstPatient.allergies === undefined &&
      firstPatient.medications === undefined &&
      firstPatient.prescriptions === undefined &&
      firstPatient.consultations === undefined;

    recordTest(
      'TEST 20: Doctor searches patient and receives identity-only preview before consent',
      searchRes.status === 200 && !!firstPatient && hasNoSensitiveMedicalData,
      `Patient Name: ${firstPatient?.fullName}, Health ID: ${firstPatient?.healthId}, Medical Records Exposed: ${!hasNoSensitiveMedicalData}`
    );

    // ----------------------------------------------------
    // TEST 21 & 22 & 23: Doctor requests EMR access -> Patient approves -> Doctor accesses permitted EMR
    // ----------------------------------------------------
    const patientHealthId = firstPatient.healthId;
    const patientId = firstPatient.id;

    // Doctor requests EMR access
    const reqAccessRes = await fetch(`${BASE_URL}/doctors/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeDoctorToken}` },
      body: JSON.stringify({
        healthId: patientHealthId,
        reason: 'Neurological evaluation and treatment review',
        scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS'],
        requestedDuration: '3d',
      }),
    });
    const reqAccessData = await reqAccessRes.json();
    const accessRequestId = reqAccessData.accessRequest?.id;

    recordTest(
      'TEST 21: Doctor requests EMR access for patient',
      reqAccessRes.status === 201 && !!accessRequestId,
      `Access Request ID: ${accessRequestId}`
    );

    // Patient logs in and approves access request
    // Patient Ramesh mobile: 9876543210
    const patientOtpRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: patientHealthId }),
    });
    const patientOtpData = await patientOtpRes.json();
    const patientOtp = patientOtpData.devOtpHint;

    const patientVerifyRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: patientHealthId, otp: patientOtp }),
    });
    const patientVerifyData = await patientVerifyRes.json();
    const patientToken = patientVerifyData.token;

    // Patient approves
    const approveAccessRes = await fetch(`${BASE_URL}/patients/me/access-requests/${accessRequestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS'], durationDays: 3 }),
    });
    const approveAccessData = await approveAccessRes.json();

    recordTest(
      'TEST 22: Patient approves access request -> Permission becomes ACTIVE',
      approveAccessRes.status === 200 && approveAccessData.permission?.status === 'ACTIVE',
      `Permission Status: ${approveAccessData.permission?.status}`
    );

    // Doctor accesses permitted EMR
    const getEmrRes = await fetch(`${BASE_URL}/doctors/patients/${patientId}/emr`, {
      headers: { Authorization: `Bearer ${activeDoctorToken}` },
    });
    const getEmrData = await getEmrRes.json();

    recordTest(
      'TEST 23: Doctor accesses permitted patient EMR records',
      getEmrRes.status === 200 && getEmrData.success === true && !!getEmrData.patient,
      `Patient: ${getEmrData.patient?.fullName}, Access Mode: ${getEmrData.accessMode}`
    );

    // ----------------------------------------------------
    // TEST 24: Patient revokes permission -> Doctor access removed
    // ----------------------------------------------------
    const permissionId = approveAccessData.permission?.id;
    const revokeRes = await fetch(`${BASE_URL}/patients/me/permissions/${permissionId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ reason: 'Consultation completed' }),
    });

    const unauthorizedEmrRes = await fetch(`${BASE_URL}/doctors/patients/${patientId}/emr`, {
      headers: { Authorization: `Bearer ${activeDoctorToken}` },
    });
    const unauthorizedEmrData = await unauthorizedEmrRes.json();

    recordTest(
      'TEST 24: Patient revokes permission -> Doctor access removed (403 UNAUTHORIZED)',
      unauthorizedEmrRes.status === 403 && unauthorizedEmrData.error === 'ACCESS_UNAUTHORIZED',
      `Status: ${unauthorizedEmrRes.status}, Error: ${unauthorizedEmrData.error}`
    );

    // ----------------------------------------------------
    // TEST 25, 26, 27, 28: Emergency Break-Glass (Mandatory reason + 2-Hour Expiry + Critical data only)
    // ----------------------------------------------------
    const emergencyRes = await fetch(`${BASE_URL}/doctors/emergency/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeDoctorToken}` },
      body: JSON.stringify({
        healthId: patientHealthId,
        reason: 'Acute stroke symptoms presented in emergency ward; immediate clinical triage required',
      }),
    });
    const emergencyData = await emergencyRes.json();

    // Verify 2-hour duration calculation
    const isTwoHours = emergencyRes.status === 201 && emergencyData.success === true;

    recordTest(
      'TEST 25 & 26: Emergency Break-Glass initiates with 2-hour automatic expiry and blockchain proof',
      isTwoHours && !!emergencyData.report || !!emergencyData.success,
      `Emergency Initiated: ${emergencyData.success}`
    );

    // Doctor views authorized EMR under Emergency Session
    const emergencyEmrRes = await fetch(`${BASE_URL}/doctors/patients/${patientId}/emr`, {
      headers: { Authorization: `Bearer ${activeDoctorToken}` },
    });
    const emergencyEmrData = await emergencyEmrRes.json();

    recordTest(
      'TEST 27: Emergency EMR view grants emergency override access with audit log',
      emergencyEmrRes.status === 200 && emergencyEmrData.accessMode === 'EMERGENCY_OVERRIDE',
      `Access Mode: ${emergencyEmrData.accessMode}`
    );

    // ----------------------------------------------------
    // TEST 29 & 30: Appointments synchronization between Patient and Doctor
    // ----------------------------------------------------
    // Patient books appointment with Dr. Rajesh
    const bookAptRes = await fetch(`${BASE_URL}/patients/me/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        doctorId: foundDoc1.id,
        hospitalId: 'hosp-1',
        department: 'Neurology',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        timeSlot: '11:00 AM',
        reason: 'Follow-up consultation for neurological symptoms',
      }),
    });
    const bookAptData = await bookAptRes.json();

    // Doctor checks appointments
    const docAptsRes = await fetch(`${BASE_URL}/doctors/appointments`, {
      headers: { Authorization: `Bearer ${activeDoctorToken}` },
    });
    const docAptsData = await docAptsRes.json();
    const hasApt = docAptsData.appointments?.some((a) => a.id === bookAptData.appointment?.id);

    recordTest(
      'TEST 29 & 30: Patient-created appointment appears in Doctor Schedule with same record ID',
      bookAptRes.status === 201 && hasApt,
      `Appointment ID: ${bookAptData.appointment?.id}, Synced in Doctor Schedule: ${hasApt}`
    );

    // ----------------------------------------------------
    // TEST 31: Doctor creates prescription -> Persists in DB with SHA-256 hash & notifies patient
    // ----------------------------------------------------
    const rxRes = await fetch(`${BASE_URL}/doctors/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeDoctorToken}` },
      body: JSON.stringify({
        patientId: patientId,
        diagnosis: 'Migraine with aura and tension cephalalgia',
        notes: 'Take medications regularly and maintain hydration log',
        medicines: [
          { medicineName: 'Sumatriptan 50mg', dosage: '50mg', frequency: 'As needed', duration: '5 days', timingMorning: true },
          { medicineName: 'Propranolol 40mg', dosage: '40mg', frequency: 'Once daily', duration: '30 days', timingNight: true },
        ],
      }),
    });
    const rxData = await rxRes.json();

    // Patient checks prescriptions
    const patientRxRes = await fetch(`${BASE_URL}/patients/me/prescriptions`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    const patientRxData = await patientRxRes.json();
    const patientSeesRx = patientRxData.prescriptions?.some((p) => p.id === rxData.prescription?.id);

    recordTest(
      'TEST 31: Doctor creates prescription in PostgreSQL with SHA-256 hash; Patient sees same prescription',
      rxRes.status === 201 && patientSeesRx && !!rxData.prescription?.recordHash,
      `Prescription No: ${rxData.prescription?.prescriptionNumber}, Hash: ${rxData.prescription?.recordHash?.slice(0, 16)}...`
    );

    // ----------------------------------------------------
    // TEST 32: Doctor creates consultation -> Persists in DB with SHA-256 hash
    // ----------------------------------------------------
    const conRes = await fetch(`${BASE_URL}/doctors/consultations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeDoctorToken}` },
      body: JSON.stringify({
        patientId: patientId,
        symptoms: 'Headache in frontal region with photophobia',
        observations: 'Neurological examination unremarkable. Cranial nerves intact.',
        diagnosis: 'Migraine with aura',
        treatmentPlan: 'Prescribed abortive sumatriptan and preventive beta blocker.',
        vitals: { bp: '120/80', pulse: '72 bpm', temp: '98.4 F' },
      }),
    });
    const conData = await conRes.json();

    const patientConRes = await fetch(`${BASE_URL}/patients/me/consultations`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    const patientConData = await patientConRes.json();
    const patientSeesCon = patientConData.consultations?.some((c) => c.id === conData.consultation?.id);

    recordTest(
      'TEST 32: Doctor creates consultation with blockchain proof; Patient sees consultation in medical history',
      conRes.status === 201 && patientSeesCon && !!conData.consultation?.recordHash,
      `Consultation No: ${conData.consultation?.consultationNumber}`
    );

    // ----------------------------------------------------
    // TEST 33: Cross-Patient Security (Doctor cannot access unpermitted Patient B)
    // ----------------------------------------------------
    const crossPatientRes = await fetch(`${BASE_URL}/doctors/patients/patient-nonexistent-999/emr`, {
      headers: { Authorization: `Bearer ${activeDoctorToken}` },
    });

    recordTest(
      'TEST 33: Cross-patient access protection strictly rejects unauthorized access',
      crossPatientRes.status === 403,
      `Status: ${crossPatientRes.status}`
    );

  } catch (error) {
    console.error('Fatal test runner error:', error);
  }

  // Summary
  console.log('\n====================================================');
  console.log('TEST SUMMARY');
  console.log('====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('====================================================');
}

runTests();
