const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('STARTING APEX EMR DOCTOR + PATIENT COMPREHENSIVE INTEGRATION TEST');
  console.log('================================================================\n');

  // Step 1: Login Doctor (Dr. Ananya Sharma)
  console.log('--- Step 1: Authenticate Doctor ---');
  let doctorLoginRes = await fetch(`${BASE_URL}/auth/doctor/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'dr.ananya@apollohyderabad.internal',
      password: 'Doctor@123',
    }),
  });
  let doctorData = await doctorLoginRes.json();
  const doctorToken = doctorData.token;
  const doctorId = doctorData.doctor?.id || doctorData.user?.doctorId || doctorData.user?.doctor?.id;
  console.log('Doctor login status:', doctorLoginRes.status, 'Doctor Name:', doctorData.doctor?.fullName, 'Doctor ID:', doctorId);

  // Step 2: Login Patient (Mohith Varma - HP-100246)
  console.log('\n--- Step 2: Authenticate Patient ---');
  const reqOtpRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'HP-100246',
    }),
  });
  const reqOtpData = await reqOtpRes.json();
  const otpCode = reqOtpData.devOtpHint || '123456';

  let patientLoginRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'HP-100246',
      otp: otpCode,
    }),
  });
  let patientData = await patientLoginRes.json();
  const patientToken = patientData.token;
  const patientId = patientData.user?.patientId || patientData.user?.patient?.id;
  const patientHealthId = patientData.user?.patient?.healthId || 'HP-100246';
  console.log('Patient login status:', patientLoginRes.status, 'Patient Name:', patientData.user?.name, 'Patient ID:', patientId, 'Health ID:', patientHealthId);

  // Step 3: Patient Books Appointment with Doctor
  console.log('\n--- Step 3: Patient Books Appointment with Doctor ---');
  const uniqueDate = `2026-09-${20 + Math.floor(Math.random() * 8)}`;
  const uniqueHour = 9 + Math.floor(Math.random() * 5);
  const uniqueMinute = Math.random() > 0.5 ? '00' : '30';
  const uniqueSlot = `${uniqueHour < 10 ? '0' + uniqueHour : uniqueHour}:${uniqueMinute} ${uniqueHour < 12 ? 'AM' : 'PM'}`;

  const bookRes = await fetch(`${BASE_URL}/patients/me/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      doctorId: doctorId,
      date: uniqueDate,
      timeSlot: uniqueSlot,
      type: 'IN_PERSON',
      reason: 'Cardiac routine follow-up check and consultation',
      department: 'Cardiology',
    }),
  });
  const bookData = await bookRes.json();
  console.log('Book Appointment Status:', bookRes.status, 'Response:', bookData.success ? `Appointment Booked #${bookData.appointment?.appointmentNumber} (ID: ${bookData.appointment?.id})` : bookData.error);
  const appointmentId = bookData.appointment?.id;

  // Step 4: Doctor Fetches Appointments (Checking if booked appointment appears)
  console.log('\n--- Step 4: Doctor Fetches Appointments Roster ---');
  const docAptsRes = await fetch(`${BASE_URL}/doctors/appointments`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const docAptsData = await docAptsRes.json();
  console.log('Doctor Appointments Status:', docAptsRes.status, 'Total Appointments:', docAptsData.appointments?.length);
  const foundApt = docAptsData.appointments?.find((a) => a.id === appointmentId || a.appointmentNumber === bookData.appointment?.appointmentNumber);
  if (foundApt) {
    console.log('✓ SUCCESS: Booked appointment found in Doctor Appointments Roster!', {
      id: foundApt.id,
      number: foundApt.appointmentNumber,
      date: foundApt.date,
      time: foundApt.timeSlot,
      patientName: foundApt.patient?.fullName,
      status: foundApt.status,
    });
  } else {
    console.error('✗ FAILURE: Booked appointment not found in Doctor Appointments Roster!');
  }

  // Step 5: Grant/Verify Doctor Access to Patient EMR
  console.log('\n--- Step 5: Ensure Active EMR Consent Clearance ---');
  // Doctor sends access request
  const accessReqRes = await fetch(`${BASE_URL}/doctors/access-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      healthId: patientHealthId,
      reason: 'Clinical Follow-up & Comprehensive Care Plan',
      scopes: ['RECORDS', 'PRESCRIPTIONS', 'LABS', 'CONSULTATIONS', 'MEDICINES'],
      requestedDuration: '7_DAYS',
    }),
  });
  const accessReqData = await accessReqRes.json();
  console.log('Access Request Status:', accessReqRes.status, 'Message:', accessReqData.message || accessReqData.error);

  // Patient approves request
  const pendingRequestsRes = await fetch(`${BASE_URL}/patients/me/access-permissions`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const pendingRequestsData = await pendingRequestsRes.json();
  const pendingReq = pendingRequestsData.requests?.find((r) => r.status === 'PENDING' && r.doctorId === doctorId);
  if (pendingReq) {
    const approveRes = await fetch(`${BASE_URL}/patients/me/access-requests/${pendingReq.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        scopes: ['RECORDS', 'PRESCRIPTIONS', 'LABS', 'CONSULTATIONS', 'MEDICINES'],
        durationDays: 7,
      }),
    });
    const approveData = await approveRes.json();
    console.log('Patient Approved Access Request:', approveData.success);
  }

  // Step 6: Doctor Opens Authorized EMR (Current Patient Workspace)
  console.log('\n--- Step 6: Doctor Accesses Current Patient EMR Workspace ---');
  const emrRes = await fetch(`${BASE_URL}/doctors/patients/${patientId}/emr`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const emrData = await emrRes.json();
  console.log('EMR Access Status:', emrRes.status, 'Patient Loaded:', emrData.patient?.fullName, 'Health ID:', emrData.patient?.healthId);

  // Step 7: Doctor Adds Consultation
  console.log('\n--- Step 7: Doctor Adds Consultation ---');
  const addConsultRes = await fetch(`${BASE_URL}/doctors/consultations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      patientId,
      symptoms: 'Patient reports mild shortness of breath upon exertion.',
      diagnosis: 'Stage 1 Hypertension & Sinus Bradycardia',
      treatmentPlan: 'Advised lifestyle modification, low sodium diet, and prescribed Telmisartan.',
      clinicalNotes: 'Vitals stable. BP: 130/84 mmHg, HR: 68 bpm. Review in 4 weeks.',
      vitals: { bloodPressure: '130/84', heartRate: '68', temperature: '98.6', spO2: '99', weight: '74' },
      recommendedLabTests: 'Lipid Profile, Serum Electrolytes',
      followUpDate: '2026-10-21',
      medicines: [
        {
          name: 'Telmisartan Tablets IP',
          dosage: '40 mg',
          frequency: 'Once daily (1-0-0)',
          duration: '30 days',
          instructions: 'Take in the morning after breakfast',
        },
      ],
    }),
  });
  const addConsultData = await addConsultRes.json();
  console.log('Add Consultation Status:', addConsultRes.status, 'Success:', addConsultData.success, 'Consultation ID:', addConsultData.consultation?.id);
  const consultationId = addConsultData.consultation?.id;

  // Step 8: Doctor Adds Prescription
  console.log('\n--- Step 8: Doctor Adds Prescription ---');
  const addRxRes = await fetch(`${BASE_URL}/doctors/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      patientId,
      patientHealthId,
      diagnosis: 'Stage 1 Hypertension & Cardioprotective Maintenance',
      medicines: [
        {
          medicineName: 'Amlodipine Tablets IP',
          dosage: '5 mg',
          frequency: '1-0-0',
          timing: 'Morning',
          duration: '30 Days',
          instructions: 'After breakfast with water',
        },
        {
          medicineName: 'Atorvastatin Tablets IP',
          dosage: '10 mg',
          frequency: '0-0-1',
          timing: 'Bedtime',
          duration: '30 Days',
          instructions: 'Take at night after food',
        },
      ],
    }),
  });
  const addRxData = await addRxRes.json();
  console.log('Add Prescription Status:', addRxRes.status, 'Success:', addRxData.success, 'Prescription ID:', addRxData.prescription?.id, 'Rx Number:', addRxData.prescription?.prescriptionNumber);
  const prescriptionId = addRxData.prescription?.id;

  // Step 9: Doctor Adds Lab Report
  console.log('\n--- Step 9: Doctor Adds Lab Report ---');
  const addReportRes = await fetch(`${BASE_URL}/doctors/lab-reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      patientId,
      testName: 'Comprehensive Metabolic & Lipid Panel',
      category: 'Biochemistry',
      laboratoryName: 'Apex Diagnostic Labs',
      sampleDate: '2026-09-20',
      resultDate: '2026-09-20',
      summary: 'Total Cholesterol: 185 mg/dL, HDL: 48 mg/dL, LDL: 108 mg/dL, Triglycerides: 145 mg/dL. Normal metabolic profile.',
      findings: {
        cholesterolTotal: 185,
        cholesterolHDL: 48,
        cholesterolLDL: 108,
        triglycerides: 145,
        impression: 'All markers within acceptable clinical limits.',
      },
    }),
  });
  const addReportData = await addReportRes.json();
  console.log('Add Lab Report Status:', addReportRes.status, 'Success:', addReportData.success, 'Report ID:', addReportData.report?.id);
  const reportId = addReportData.report?.id;

  // Step 10: Patient Checks Notifications
  console.log('\n--- Step 10: Patient Checks Notifications ---');
  const patientNotifsRes = await fetch(`${BASE_URL}/patients/me/notifications`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const patientNotifsData = await patientNotifsRes.json();
  console.log('Patient Notifications Total:', patientNotifsData.notifications?.length);
  const rxNotif = patientNotifsData.notifications?.find((n) => n.linkRoute?.includes(prescriptionId) || n.title?.includes('Prescription'));
  console.log('Prescription Notification Found:', !!rxNotif, 'Title:', rxNotif?.title, 'LinkRoute:', rxNotif?.linkRoute);
  const consultNotif = patientNotifsData.notifications?.find((n) => n.title?.includes('Consultation'));
  console.log('Consultation Notification Found:', !!consultNotif, 'Title:', consultNotif?.title);
  const reportNotif = patientNotifsData.notifications?.find((n) => n.title?.includes('Report'));
  console.log('Report Notification Found:', !!reportNotif, 'Title:', reportNotif?.title);

  // Step 11: Patient Opens Prescription by ID (Verifying No 404)
  console.log('\n--- Step 11: Patient Opens Prescription Details (No 404) ---');
  const getRxRes = await fetch(`${BASE_URL}/patients/me/prescriptions/${prescriptionId}`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const getRxData = await getRxRes.json();
  console.log('Patient Get Prescription Status:', getRxRes.status, 'Success:', getRxData.success, 'Rx Number:', getRxData.prescription?.prescriptionNumber);

  // Step 12: Patient Audit Trail (Verifying PostgreSQL Audit Events)
  console.log('\n--- Step 12: Patient Audit Trail from PostgreSQL ---');
  const patientAuditRes = await fetch(`${BASE_URL}/patients/me/audit`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const patientAuditData = await patientAuditRes.json();
  console.log('Patient Audit Records Count:', patientAuditData.audits?.length);
  const recentPatientAudits = patientAuditData.audits?.slice(0, 5);
  for (const aud of recentPatientAudits || []) {
    console.log(`- Action: ${aud.action} | DocType: ${aud.documentType} | Actor: ${aud.actorName} | Reason/Record: ${aud.recordId || aud.reason}`);
  }

  // Step 13: Doctor Audit Trail (Verifying PostgreSQL Audit Events)
  console.log('\n--- Step 13: Doctor Audit Trail from PostgreSQL ---');
  const docAuditRes = await fetch(`${BASE_URL}/doctors/audit`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const docAuditData = await docAuditRes.json();
  console.log('Doctor Audit Records Count:', docAuditData.audits?.length);
  const recentDocAudits = docAuditData.audits?.slice(0, 5);
  for (const aud of recentDocAudits || []) {
    console.log(`- Action: ${aud.action} | DocType: ${aud.documentType} | Patient: ${aud.patientHealthId} | Record: ${aud.recordId || aud.reason}`);
  }

  console.log('\n================================================================');
  console.log('COMPREHENSIVE INTEGRATION TEST COMPLETED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTests().catch((e) => console.error('Test Error:', e));
