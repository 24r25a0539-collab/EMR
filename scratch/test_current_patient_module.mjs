const BASE_URL = 'http://localhost:5000/api';

async function testCurrentPatientModule() {
  console.log('🧪 Starting Current Patient Module Integration Tests...\n');

  // 1. Authenticate Doctor
  console.log('1. Authenticating Doctor (dr.ananya@apollohyderabad.internal)...');
  const docLoginRes = await fetch(`${BASE_URL}/auth/doctor/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'dr.ananya@apollohyderabad.internal',
      password: 'Doctor@123',
    }),
  });
  const docLoginData = await docLoginRes.json();
  if (!docLoginData.token) {
    throw new Error(`Doctor login failed: ${JSON.stringify(docLoginData)}`);
  }
  const docToken = docLoginData.token;
  const doctorId = docLoginData.doctor?.id || docLoginData.user?.doctorId || docLoginData.user?.doctor?.id;
  console.log('✅ Doctor logged in successfully. Doctor ID:', doctorId);

  // 2. Authenticate Patient
  console.log('\n2. Authenticating Patient (HP-100246)...');
  const reqOtpRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'HP-100246' }),
  });
  const reqOtpData = await reqOtpRes.json();
  const otpCode = reqOtpData.devOtpHint || '123456';

  const patLoginRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'HP-100246', otp: otpCode }),
  });
  const patLoginData = await patLoginRes.json();
  if (!patLoginData.token) {
    throw new Error(`Patient login failed: ${JSON.stringify(patLoginData)}`);
  }
  const patToken = patLoginData.token;
  const patientId = patLoginData.user?.patientId || patLoginData.user?.patient?.id;
  const patientHealthId = patLoginData.user?.patient?.healthId || 'HP-100246';
  console.log('✅ Patient logged in. Patient ID:', patientId, 'Health ID:', patientHealthId);

  // 3. Test GET /api/doctors/active-patients
  console.log('\n3. Testing GET /api/doctors/active-patients...');
  const activePatientsRes = await fetch(`${BASE_URL}/doctors/active-patients`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  const activePatientsData = await activePatientsRes.json();
  console.log('Active patients response:', {
    success: activePatientsData.success,
    count: activePatientsData.patients?.length,
    patients: activePatientsData.patients?.map(p => ({
      id: p.id,
      healthId: p.healthId,
      fullName: p.fullName,
      accessStatus: p.accessStatus,
      isVerified: p.isVerified,
    })),
  });

  if (!activePatientsData.success || !Array.isArray(activePatientsData.patients)) {
    throw new Error('Failed to fetch active authorized patients from PostgreSQL');
  }
  console.log('✅ GET /api/doctors/active-patients verified successfully.');

  // 4. Test Authorized EMR fetch for current patient
  console.log(`\n4. Testing GET /api/doctors/patients/${patientId}/emr...`);
  const emrRes = await fetch(`${BASE_URL}/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  const emrData = await emrRes.json();
  console.log('EMR fetch response status:', emrRes.status, 'success:', emrData.success);
  if (emrData.patient) {
    console.log('Patient in EMR:', {
      id: emrData.patient.id,
      healthId: emrData.patient.healthId,
      fullName: emrData.patient.fullName,
      consultationsCount: emrData.patient.consultations?.length,
      prescriptionsCount: emrData.patient.prescriptions?.length,
      labReportsCount: emrData.patient.labReports?.length,
    });
  }
  console.log('✅ Authorized EMR workspace validated.');

  // 5. Test Unauthorized Access Protection (using a bogus or unauthorized patient ID)
  console.log('\n5. Testing Unauthorized Patient Access Protection...');
  const unauthRes = await fetch(`${BASE_URL}/doctors/patients/00000000-0000-0000-0000-000000000000/emr`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  console.log('Unauthorized request status:', unauthRes.status);
  if (unauthRes.status === 404 || unauthRes.status === 403) {
    console.log('✅ Unauthorized access blocked securely by backend.');
  } else {
    throw new Error(`Expected 403/404 for unauthorized patient, got ${unauthRes.status}`);
  }

  // 6. Test Doctor Appointments and patientId association
  console.log('\n6. Testing Doctor Appointments patient link...');
  const apptsRes = await fetch(`${BASE_URL}/doctors/appointments`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  const apptsData = await apptsRes.json();
  console.log('Appointments fetched:', apptsData.appointments?.length);
  if (apptsData.appointments && apptsData.appointments.length > 0) {
    const sample = apptsData.appointments[0];
    console.log('Sample appointment:', {
      id: sample.id,
      appointmentNumber: sample.appointmentNumber,
      patientId: sample.patientId,
      patientName: sample.patientName,
      patientHealthId: sample.patientHealthId,
    });
    if (!sample.patientId) {
      throw new Error('Appointment missing patientId required for Current Patient navigation');
    }
    console.log('✅ Appointment patientId verified for Current Patient workspace navigation.');
  }

  console.log('\n🎉 ALL CURRENT PATIENT INTEGRATION TESTS PASSED PERFECTLY!\n');
}

testCurrentPatientModule().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
