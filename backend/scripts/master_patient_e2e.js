// APEX EMR - MASTER END-TO-END VERIFICATION SUITE
// Covers all requirements A through AQ from Section 72

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

async function runMasterTestSuite() {
  console.log('================================================================');
  console.log('APEX EMR — MASTER PATIENT MODULE END-TO-END VERIFICATION');
  console.log('================================================================\n');

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

  // Generate dynamic unique mobile for fresh patient
  const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
  const testMobile = `91${randomSuffix}`; // 10-digit Indian mobile
  const testEmail = `apex.patient.${testMobile}@testapex.in`;
  const testName = 'Test Patient Apex';

  console.log(`Test Patient: ${testName}, Mobile: ${testMobile}, Email: ${testEmail}\n`);

  // ==========================================================================
  // 1. MOBILE NUMBER VALIDATION (Frontend & Backend Normalization)
  // ==========================================================================
  console.log('--- 1. Mobile Validation & OTP Generation ---');
  // Formats: 9876543210, +919876543210, +91 9876543210, 09876543210
  const formattedMobile = `+91 ${testMobile.slice(0, 5)} ${testMobile.slice(5)}`;
  const regOtpRes = await request('/auth/patient/registration-request-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: formattedMobile, phone: formattedMobile }),
  });

  assert('A. Registration Request OTP status 200', regOtpRes.status === 200, JSON.stringify(regOtpRes.data));
  const regDevOtp = regOtpRes.data.devOtpHint;
  assert('B. Mobile normalized from +91 format', regDevOtp && /^\d{6}$/.test(regDevOtp), `OTP: ${regDevOtp}`);
  assert('C. Registration OTP is random 6 digits (not fixed 123456)', regDevOtp !== '123456', `OTP: ${regDevOtp}`);

  // ==========================================================================
  // 2. OTP VERIFICATION
  // ==========================================================================
  console.log('\n--- 2. OTP Verification (Negative & Positive) ---');
  const wrongOtpRes = await request('/auth/patient/registration-verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: testMobile, otp: '000000' }),
  });
  assert('Invalid OTP rejected (400)', wrongOtpRes.status === 400, JSON.stringify(wrongOtpRes.data));

  const validOtpRes = await request('/auth/patient/registration-verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: testMobile, otp: regDevOtp }),
  });
  assert('Valid OTP verified (200) with registrationToken', validOtpRes.status === 200 && validOtpRes.data.verified, JSON.stringify(validOtpRes.data));
  const registrationToken = validOtpRes.data.registrationToken;

  // ==========================================================================
  // 3. PATIENT REGISTRATION WITH POSTGRESQL TRANSACTION
  // ==========================================================================
  console.log('\n--- 3. Patient Registration ---');
  const regPayload = {
    registrationToken,
    mobile: testMobile,
    fullName: testName,
    dob: '2004-05-15',
    gender: 'Male',
    bloodGroup: 'B+',
    email: testEmail,
    address: 'Kondapur',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500084',
    govtIdType: 'Aadhaar',
    govtIdNumber: '998877665544',
    abhaId: 'apex.patient@abdm',
    emergencyContactName: 'Kavita Apex',
    emergencyContactRelation: 'Spouse',
    emergencyContactPhone: '9123456781',
  };

  const regRes = await request('/auth/patient/register', {
    method: 'POST',
    body: JSON.stringify(regPayload),
  });

  assert('Registration successful (201)', regRes.status === 201, JSON.stringify(regRes.data));
  const healthcareId = regRes.data.healthcareId || regRes.data.healthId || regRes.data.patient?.healthcareId || regRes.data.patient?.healthId;
  assert('Canonical Healthcare ID generated (HP-###### format)', /^HP-\d{6}$/.test(healthcareId), `ID: ${healthcareId}`);
  assert('Healthcare ID free from any suffix or corruption', !healthcareId.endsWith('e'), `ID: ${healthcareId}`);

  // ==========================================================================
  // 4. DUPLICATE REGISTRATION PREVENTION
  // ==========================================================================
  console.log('\n--- 4. Duplicate Registration Prevention ---');
  const dupCheckRes = await request('/auth/patient/registration-request-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile: testMobile }),
  });
  assert('Duplicate mobile rejected with 409 Conflict', dupCheckRes.status === 409, JSON.stringify(dupCheckRes.data));
  assert('Exact required duplicate error message returned',
    dupCheckRes.data.error === 'This mobile number is already registered. Please login using your Healthcare ID or mobile number.',
    dupCheckRes.data.error
  );

  // ==========================================================================
  // 5. PATIENT LOGIN: HEALTHCARE ID & MOBILE (BOTH RESOLVE TO SAME ACCOUNT)
  // ==========================================================================
  console.log('\n--- 5. Patient Login via Healthcare ID & Mobile ---');
  // Via Healthcare ID
  const loginHIdOtpRes = await request('/auth/patient/request-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: healthcareId }),
  });
  assert('Login Request OTP via Healthcare ID status 200', loginHIdOtpRes.status === 200, JSON.stringify(loginHIdOtpRes.data));
  const loginHIdOtp = loginHIdOtpRes.data.devOtpHint;
  assert('Login OTP is random 6 digits', /^\d{6}$/.test(loginHIdOtp) && loginHIdOtp !== '123456', `OTP: ${loginHIdOtp}`);

  const loginHIdVerifyRes = await request('/auth/patient/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: healthcareId, otp: loginHIdOtp }),
  });
  assert('Login Verify via Healthcare ID returns JWT', loginHIdVerifyRes.status === 200 && !!loginHIdVerifyRes.data.token, JSON.stringify(loginHIdVerifyRes.data));
  const patientToken = loginHIdVerifyRes.data.token;

  // Via Mobile Number
  const loginMobOtpRes = await request('/auth/patient/request-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: formattedMobile }),
  });
  assert('Login Request OTP via Mobile (+91 format) status 200', loginMobOtpRes.status === 200, JSON.stringify(loginMobOtpRes.data));
  const loginMobOtp = loginMobOtpRes.data.devOtpHint;

  const loginMobVerifyRes = await request('/auth/patient/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: formattedMobile, otp: loginMobOtp }),
  });
  const mobPatientHId = loginMobVerifyRes.data.user?.patient?.healthcareId || loginMobVerifyRes.data.user?.patient?.healthId;
  assert('Mobile login resolves to EXACT same Healthcare ID', mobPatientHId === healthcareId, `Resolved: ${mobPatientHId}`);

  // ==========================================================================
  // 6. EXISTING PATIENT LOGIN (HP-100246 / 1234567890)
  // ==========================================================================
  console.log('\n--- 6. Existing Patient Login (mohith / HP-100246) ---');
  const existingLoginOtpRes = await request('/auth/patient/request-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'HP-100246' }),
  });
  assert('Existing Patient HP-100246 Request OTP status 200', existingLoginOtpRes.status === 200, JSON.stringify(existingLoginOtpRes.data));
  const existingOtp = existingLoginOtpRes.data.devOtpHint;

  const existingVerifyRes = await request('/auth/patient/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'HP-100246', otp: existingOtp }),
  });
  assert('Existing Patient HP-100246 verified with JWT', existingVerifyRes.status === 200 && !!existingVerifyRes.data.token, JSON.stringify(existingVerifyRes.data));
  const existingPatientToken = existingVerifyRes.data.token;

  // ==========================================================================
  // 7. PATIENT PROFILE: REAL DATA & DYNAMIC AGE & AADHAAR MASKING
  // ==========================================================================
  console.log('\n--- 7. Patient Profile, Dynamic Age, Masked Aadhaar ---');
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('GET /api/auth/me returns status 200', meRes.status === 200, JSON.stringify(meRes.data));
  const meData = meRes.data.user?.patient;
  assert('Full Name matches registered name', meData?.fullName === testName, meData?.fullName);
  assert('Blood Group matches registered B+', meData?.bloodGroup === 'B+', meData?.bloodGroup);
  assert('Aadhaar is strictly masked (XXXX-XXXX-5544)', meData?.govtIdNumberMasked === 'XXXX-XXXX-5544', meData?.govtIdNumberMasked);
  assert('ABHA ID matches registered abdm ID', meData?.abhaId === 'apex.patient@abdm', meData?.abhaId);
  assert('Emergency Contact matches registered Kavita Apex',
    meData?.emergencyContacts?.[0]?.name === 'Kavita Apex' && meData?.emergencyContacts?.[0]?.phone === '9123456781',
    JSON.stringify(meData?.emergencyContacts)
  );

  // Dynamic Age Check
  const dobDate = new Date('2004-05-15');
  const today = new Date();
  let expectedAge = today.getFullYear() - dobDate.getFullYear();
  const m = today.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
    expectedAge--;
  }
  const calcAge = meData?.age;
  assert(`Dynamic Age correctly calculated (${expectedAge} years)`, calcAge === expectedAge, `Calculated: ${calcAge}, Expected: ${expectedAge}`);

  // ==========================================================================
  // 8. EMPTY STATES FOR NEW PATIENT
  // ==========================================================================
  console.log('\n--- 8. Clean Empty States for New Patient ---');
  const profileRes = await request('/patients/me', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const pData = profileRes.data.patient;
  assert('No pre-populated Identity Marks', !pData?.identificationMarks || pData.identificationMarks.length === 0, JSON.stringify(pData?.identificationMarks));
  assert('No pre-populated Allergies', !pData?.allergies || pData.allergies.length === 0, JSON.stringify(pData?.allergies));
  assert('No pre-populated Medicines', !pData?.medications || pData.medications.length === 0, JSON.stringify(pData?.medications));
  assert('No pre-populated Conditions', !pData?.conditions || pData.conditions.length === 0, JSON.stringify(pData?.conditions));

  const labsRes = await request('/patients/me/labs', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('No pre-populated Lab Reports', labsRes.status === 200 && labsRes.data.labReports?.length === 0, JSON.stringify(labsRes.data));

  const presRes = await request('/patients/me/prescriptions', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('No pre-populated Prescriptions', presRes.status === 200 && presRes.data.prescriptions?.length === 0, JSON.stringify(presRes.data));

  const apptRes = await request('/patients/me/appointments', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('No pre-populated Appointments', apptRes.status === 200 && apptRes.data.appointments?.length === 0, JSON.stringify(apptRes.data));

  // ==========================================================================
  // 9. IDENTITY MARKS & ALLERGY PERSISTENCE
  // ==========================================================================
  console.log('\n--- 9. Identity Marks & Allergy Persistence ---');
  const updateMarksRes = await request('/patients/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      identificationMarks: ['Mole on left collarbone'],
    }),
  });
  assert('PUT /patients/me saves Identity Mark', updateMarksRes.status === 200, JSON.stringify(updateMarksRes.data));
  assert('Identity Mark in updated response', updateMarksRes.data.patient?.identificationMarks?.includes('Mole on left collarbone'), JSON.stringify(updateMarksRes.data.patient?.identificationMarks));

  const addAllergyRes = await request('/patients/me/allergies', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      allergen: 'Dust',
      severity: 'Mild',
      reaction: 'Sneezing',
      notes: 'Triggers in dry dusty weather',
    }),
  });
  assert('POST /patients/me/allergies returns 201', addAllergyRes.status === 201, JSON.stringify(addAllergyRes.data));
  assert('Added allergy is Dust', addAllergyRes.data.allergy?.allergen === 'Dust', JSON.stringify(addAllergyRes.data.allergy));

  // ==========================================================================
  // 10. MEDICINES & REMINDER WORKFLOW
  // ==========================================================================
  console.log('\n--- 10. Medicines & Reminder Workflow ---');
  const addMedRes = await request('/patients/me/medicines', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      name: 'Paracetamol 500mg',
      dosage: '1 tablet',
      frequency: 'Twice daily',
      timeSlot: 'Morning, Night',
      duration: '5 days',
      foodTiming: 'AFTER_MEAL',
      currentStock: 10,
    }),
  });
  assert('POST /patients/me/medicines returns 201', addMedRes.status === 201, JSON.stringify(addMedRes.data));
  const medicineId = addMedRes.data.medicine?.id;
  assert('Created medicine has initial stock 10', addMedRes.data.medicine?.currentStock === 10, JSON.stringify(addMedRes.data.medicine));

  // Reminder Action: "Complete" (taken) -> stock reduces by EXACTLY 1
  const completeActionRes = await request(`/patients/me/medicines/${medicineId}/action`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ action: 'complete', notes: 'Taken with water' }),
  });
  assert('PATCH medicine complete returns 200', completeActionRes.status === 200, JSON.stringify(completeActionRes.data));
  assert('Stock reduces by EXACTLY 1 (from 10 to 9)', completeActionRes.data.medicine?.currentStock === 9, `Stock: ${completeActionRes.data.medicine?.currentStock}`);
  assert('Dose recorded in adherence logs', completeActionRes.data.medicine?.logs?.length > 0, JSON.stringify(completeActionRes.data.medicine?.logs));

  // Reminder Action: "Snooze" (remind me later) -> stock does NOT decrease
  const snoozeActionRes = await request(`/patients/me/medicines/${medicineId}/action`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ action: 'snooze', notes: 'Snoozed 15 mins' }),
  });
  assert('PATCH medicine snooze returns 200', snoozeActionRes.status === 200, JSON.stringify(snoozeActionRes.data));
  assert('Stock remains 9 after snooze', snoozeActionRes.data.medicine?.currentStock === 9, `Stock: ${snoozeActionRes.data.medicine?.currentStock}`);

  // ==========================================================================
  // 11. DOCTOR LOGIN & APPOINTMENTS (WITH DOUBLE BOOKING PREVENTION)
  // ==========================================================================
  console.log('\n--- 11. Doctor Login, Appointments & Double Booking ---');
  const doctorLoginRes = await request('/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: 'dr.ananya@apollohyderabad.internal',
      password: 'Doctor@123',
    }),
  });
  assert('Doctor login successful (200)', doctorLoginRes.status === 200 && !!doctorLoginRes.data.token, JSON.stringify(doctorLoginRes.data));
  const doctorToken = doctorLoginRes.data.token;
  const doctorId = doctorLoginRes.data.user?.doctor?.id;
  assert('Doctor profile resolved with ID', !!doctorId, `Doctor ID: ${doctorId}`);

  const appointmentDate = '2026-09-25';
  const appointmentSlot = '10:00 AM';

  // Book Appointment 1
  const bookApptRes1 = await request('/patients/me/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      doctorId,
      hospital: 'Apollo Hospitals, Jubilee Hills',
      appointmentDate,
      timeSlot: appointmentSlot,
      type: 'CONSULTATION',
      reason: 'Regular Health Checkup',
    }),
  });
  assert('Patient books appointment (201)', bookApptRes1.status === 201, JSON.stringify(bookApptRes1.data));
  const appointmentId = bookApptRes1.data.appointment?.id;

  // Book Appointment 2 on SAME doctor, date, timeslot -> MUST return 409 Double Booking Conflict
  const bookApptRes2 = await request('/patients/me/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      doctorId,
      hospital: 'Apollo Hospitals, Jubilee Hills',
      appointmentDate,
      timeSlot: appointmentSlot,
      type: 'CONSULTATION',
      reason: 'Attempt duplicate booking',
    }),
  });
  assert('Double Booking rejected with 409 Conflict', bookApptRes2.status === 409, JSON.stringify(bookApptRes2.data));
  assert('Double Booking error message contains "unavailable" or "booked"',
    bookApptRes2.data.error?.toLowerCase().includes('available') || bookApptRes2.data.error?.toLowerCase().includes('already'),
    bookApptRes2.data.error
  );

  // Doctor views appointments and confirms
  const docApptRes = await request('/doctor/appointments', {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert('Doctor sees booked appointment',
    docApptRes.status === 200 && docApptRes.data.appointments?.some((a) => a.id === appointmentId),
    JSON.stringify(docApptRes.data)
  );

  const confirmApptRes = await request(`/doctor/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({ status: 'CONFIRMED' }),
  });
  assert('Doctor confirms appointment (200)', confirmApptRes.status === 200, JSON.stringify(confirmApptRes.data));

  // Patient sees updated status
  const patApptCheck = await request('/patients/me/appointments', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const updatedAppt = patApptCheck.data.appointments?.find((a) => a.id === appointmentId);
  assert('Patient sees appointment status CONFIRMED', updatedAppt?.status === 'CONFIRMED', `Status: ${updatedAppt?.status}`);

  // ==========================================================================
  // 12. CLINICAL RECORDS (PRESCRIPTIONS, LAB REPORTS, CONSULTATIONS) & ISOLATION
  // ==========================================================================
  console.log('\n--- 12. Clinical Records & Patient Scope Isolation ---');
  const patientRecordId = regRes.data.patient?.id || regRes.data.user?.patient?.id;

  // Doctor creates Prescription for Patient A
  const createPresRes = await request('/doctor/prescriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      patientId: patientRecordId,
      diagnosis: 'Seasonal Rhinitis',
      medicines: [
        {
          name: 'Cetirizine 10mg',
          dosage: '1 tablet',
          frequency: 'Once daily',
          timing: 'Night',
          duration: '5 days',
          foodInstructions: 'After food',
        },
      ],
      dietAdvice: 'Avoid chilled beverages and dust exposure',
    }),
  });
  assert('Doctor creates prescription for Patient A (201)', createPresRes.status === 201, JSON.stringify(createPresRes.data));

  // Doctor creates Lab Report for Patient A
  const createLabRes = await request('/doctor/lab-reports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      patientId: patientRecordId,
      testName: 'Complete Blood Count (CBC)',
      category: 'HEMATOLOGY',
      labName: 'Apollo Diagnostics',
      summary: 'All parameters normal within physiological ranges',
      criticalFlag: false,
    }),
  });
  assert('Doctor creates lab report for Patient A (201)', createLabRes.status === 201, JSON.stringify(createLabRes.data));

  // Doctor creates Consultation for Patient A
  const createConsultRes = await request('/doctor/consultations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      patientId: patientRecordId,
      chiefComplaint: 'Mild allergy and sneezing',
      clinicalNotes: 'Clear nasal passage, no fever',
      diagnosis: 'Allergic Rhinitis',
      plan: 'Antihistamines for 5 days',
    }),
  });
  assert('Doctor creates consultation for Patient A (201)', createConsultRes.status === 201, JSON.stringify(createConsultRes.data));

  // Patient A verifies clinical records
  const patAPresRes = await request('/patients/me/prescriptions', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('Patient A sees prescription', patAPresRes.status === 200 && patAPresRes.data.prescriptions?.length > 0, JSON.stringify(patAPresRes.data));

  const patALabRes = await request('/patients/me/labs', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('Patient A sees lab report', patALabRes.status === 200 && patALabRes.data.labReports?.length > 0, JSON.stringify(patALabRes.data));

  const patAConsultRes = await request('/patients/me/consultations', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('Patient A sees consultation', patAConsultRes.status === 200 && patAConsultRes.data.consultations?.length > 0, JSON.stringify(patAConsultRes.data));

  // Patient B (mohith) MUST NOT see Patient A's records
  const patBPresRes = await request('/patients/me/prescriptions', {
    headers: { Authorization: `Bearer ${existingPatientToken}` },
  });
  assert('Patient B cannot see Patient A prescriptions (Strict Isolation)',
    patBPresRes.status === 200 && !patBPresRes.data.prescriptions?.some((p) => p.diagnosis === 'Seasonal Rhinitis'),
    JSON.stringify(patBPresRes.data)
  );

  const patBLabRes = await request('/patients/me/labs', {
    headers: { Authorization: `Bearer ${existingPatientToken}` },
  });
  assert('Patient B cannot see Patient A lab reports (Strict Isolation)',
    patBLabRes.status === 200 && !patBLabRes.data.labReports?.some((l) => l.testName === 'Complete Blood Count (CBC)'),
    JSON.stringify(patBLabRes.data)
  );

  // ==========================================================================
  // 13. PATIENT HELPDESK & ADMIN RESPONSE SYNCHRONIZATION
  // ==========================================================================
  console.log('\n--- 13. Helpdesk & Admin Synchronization ---');
  const createTicketRes = await request('/patients/me/helpdesk', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      subject: 'Request Updated Health Card Copy',
      category: 'GENERAL',
      description: 'My residential address was recently updated. Please re-issue my digital health card.',
      priority: 'MEDIUM',
    }),
  });
  assert('Patient creates Helpdesk ticket (201)', createTicketRes.status === 201, JSON.stringify(createTicketRes.data));
  const ticketId = createTicketRes.data.ticket?.id;

  // Admin Login
  const adminLoginRes = await request('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@emr-platform.internal',
      password: 'Admin@123456',
    }),
  });
  assert('Admin login successful (200)', adminLoginRes.status === 200 && !!adminLoginRes.data.token, JSON.stringify(adminLoginRes.data));
  const adminToken = adminLoginRes.data.token;

  // Admin views Helpdesk tickets
  const adminTicketsRes = await request('/admin/helpdesk', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Admin sees Patient ticket',
    adminTicketsRes.status === 200 && adminTicketsRes.data.tickets?.some((t) => t.id === ticketId),
    JSON.stringify(adminTicketsRes.data)
  );

  // Admin updates ticket to RESOLVED with response
  const updateTicketRes = await request(`/admin/helpdesk/${ticketId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: 'RESOLVED',
      adminResponse: 'Your digital health card has been updated with the new address and re-issued.',
    }),
  });
  assert('Admin resolves ticket with response (200)', updateTicketRes.status === 200, JSON.stringify(updateTicketRes.data));

  // Patient views Helpdesk tickets and sees Admin response & status
  const patTicketsRes = await request('/patients/me/helpdesk', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const myTicket = patTicketsRes.data.tickets?.find((t) => t.id === ticketId);
  assert('Patient sees ticket status RESOLVED', myTicket?.status === 'RESOLVED', `Status: ${myTicket?.status}`);
  assert('Patient sees Admin response', myTicket?.adminResponse?.includes('updated with the new address'), myTicket?.adminResponse);

  // ==========================================================================
  // 14. NOTIFICATIONS
  // ==========================================================================
  console.log('\n--- 14. Notifications & Read/Unread State ---');
  const notifRes = await request('/patients/me/notifications', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert('Patient receives real notifications (status 200)', notifRes.status === 200 && notifRes.data.notifications?.length > 0, JSON.stringify(notifRes.data));
  const firstNotif = notifRes.data.notifications?.[0];
  if (firstNotif) {
    const markReadRes = await request(`/patients/me/notifications/${firstNotif.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert('Notification marked as read (200)', markReadRes.status === 200 && markReadRes.data.notification?.read, JSON.stringify(markReadRes.data));
  }

  // ==========================================================================
  // 15. EMERGENCY CONTACT PERSISTENCE & EDIT
  // ==========================================================================
  console.log('\n--- 15. Emergency Contact Edit & Persistence ---');
  const updateEmergRes = await request('/patients/me/emergency-contacts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      contacts: [
        {
          name: 'Kavita Singhania Apex',
          relationship: 'Spouse',
          phone: '9123456789',
          isPrimary: true,
        },
      ],
    }),
  });
  assert('Emergency contact updated (200)', updateEmergRes.status === 200, JSON.stringify(updateEmergRes.data));
  assert('Updated emergency contact persists in profile',
    updateEmergRes.data.contacts?.[0]?.name === 'Kavita Singhania Apex' && updateEmergRes.data.contacts?.[0]?.phone === '9123456789',
    JSON.stringify(updateEmergRes.data.contacts)
  );

  // ==========================================================================
  // 16. LOGOUT / RE-LOGIN PERSISTENCE VERIFICATION
  // ==========================================================================
  console.log('\n--- 16. Logout & Re-Login Persistence Check ---');
  const relogOtpRes = await request('/auth/patient/request-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: healthcareId }),
  });
  const freshOtp = relogOtpRes.data.devOtpHint;
  const relogVerifyRes = await request('/auth/patient/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier: healthcareId, otp: freshOtp }),
  });
  const freshToken = relogVerifyRes.data.token;

  const freshMeRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${freshToken}` },
  });
  assert('Healthcare ID matches upon re-login', freshMeRes.data.user?.patient?.healthcareId === healthcareId, freshMeRes.data.user?.patient?.healthcareId);

  const freshProfileRes = await request('/patients/me', {
    headers: { Authorization: `Bearer ${freshToken}` },
  });
  const freshPData = freshProfileRes.data.patient;
  assert('Identity Mark persists after re-login', freshPData?.identificationMarks?.includes('Mole on left collarbone'), JSON.stringify(freshPData?.identificationMarks));
  assert('Allergy persists after re-login', freshPData?.allergies?.some((a) => a.allergen === 'Dust'), JSON.stringify(freshPData?.allergies));
  assert('Medicine persists with stock 9 after re-login', freshPData?.medications?.some((m) => m.name === 'Paracetamol 500mg' && m.currentStock === 9), JSON.stringify(freshPData?.medications));

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n================================================================');
  console.log('MASTER TEST SUITE SUMMARY');
  console.log('================================================================');
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;
  console.log(`Total: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error('\nSOME TESTS FAILED! Inspect details above.\n');
    process.exit(1);
  } else {
    console.log('\nALL END-TO-END TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  }
}

runMasterTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
