const BASE_URL = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('=== APEX EMR PATIENT MODULE COMPLETE E2E VERIFICATION ===\n');
  const results = [];
  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      results.push({ name, status: 'PASS', details });
    } else {
      console.error(`[FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      results.push({ name, status: 'FAIL', details });
    }
  }

  try {
    // 1. Mobile Normalization and Registration OTP
    const cleanMobile = '98765' + Math.floor(10000 + Math.random() * 90000);
    const rawMobile = '+91 ' + cleanMobile;
    console.log(`\n--- Test Phase 1: Patient Registration (Mobile: ${rawMobile}) ---`);
    const regOtpRes = await (await fetch(`${BASE_URL}/auth/patient/registration-request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: rawMobile }),
    })).json();

    assert('1. Patient Registration Request OTP', regOtpRes.success === true, `Masked: ${regOtpRes.maskedMobile}, DevOTP: ${regOtpRes.devOtpHint}`);

    const devOtp = regOtpRes.devOtpHint;

    // Verify OTP
    const verifyOtpRes = await (await fetch(`${BASE_URL}/auth/patient/registration-verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: cleanMobile, otp: devOtp }),
    })).json();

    assert('2. Patient Registration Verify OTP', verifyOtpRes.success === true && verifyOtpRes.verified === true);

    // Complete Patient Registration
    const randomAadhaar = '9999' + Math.floor(10000000 + Math.random() * 90000000);
    const regPayload = {
      mobile: cleanMobile,
      fullName: 'Ramesh Kumar Test',
      email: `ramesh.${Date.now()}@example.com`,
      dob: '1998-05-15',
      gender: 'MALE',
      bloodGroup: 'B+',
      address: 'Plot 42, Hitech City',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500081',
      aadhaar: randomAadhaar,
      emergencyContactName: 'Suresh Kumar',
      emergencyRelation: 'Brother',
      emergencyPhone: '9876500001',
      identificationMarks: ['Scar on left forearm', 'Mole on right cheek'],
    };

    const regRes = await (await fetch(`${BASE_URL}/auth/patient/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    })).json();

    assert('3. Patient Registration Submission', regRes.success === true && !!regRes.token, `HealthID: ${regRes.patient?.healthId}`);
    assert('4. Healthcare ID Format (HP-XXXXXX)', /^HP-\d{6}$/.test(regRes.patient?.healthId), `ID: ${regRes.patient?.healthId}`);
    assert('5. Masked Aadhaar Protection', regRes.patient?.govtIdNumber?.includes('XXXX-XXXX-'), `Masked: ${regRes.patient?.govtIdNumber}`);

    const patientToken = regRes.token;
    const healthId = regRes.patient?.healthId;
    const patientId = regRes.patient?.id;

    // 2. Patient Login Tests
    console.log('\n--- Test Phase 2: Patient Login ---');
    // Login with Health ID
    const loginOtpReq = await (await fetch(`${BASE_URL}/auth/patient/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: healthId }),
    })).json();
    assert('6. Request Login OTP with Healthcare ID', loginOtpReq.success === true && !!loginOtpReq.devOtpHint);

    const loginVerify = await (await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: healthId, otp: loginOtpReq.devOtpHint }),
    })).json();
    assert('7. Verify Login OTP and Issue JWT', loginVerify.success === true && !!loginVerify.token);

    // Login with Mobile
    const loginMobileReq = await (await fetch(`${BASE_URL}/auth/patient/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanMobile }),
    })).json();
    assert('8. Request Login OTP with Mobile', loginMobileReq.success === true && !!loginMobileReq.devOtpHint);

    // 3. Profile & Identity Tests
    console.log('\n--- Test Phase 3: Profile, Age & Identity ---');
    const profileRes = await (await fetch(`${BASE_URL}/patients/me`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })).json();

    const p = profileRes.patient || profileRes.data;
    assert('9. Profile PostgreSQL Load', profileRes.success === true && p.fullName === 'Ramesh Kumar Test');
    // 1998-05-15 in 2026 => 28 years old
    assert('10. Dynamic Age Calculation from DOB', typeof p.age === 'number' && p.age >= 27 && p.age <= 29, `Age: ${p.age} Years`);
    assert('11. Masked Aadhaar on Profile', p.govtIdNumber?.includes('XXXX-XXXX-') || p.govtIdNumberMasked?.includes('XXXX-XXXX-'), `Aadhaar: ${p.govtIdNumber}`);
    assert('12. Emergency Contact Loaded from DB', p.emergencyContacts?.length > 0 && p.emergencyContacts[0].name === 'Suresh Kumar', `Contact: ${p.emergencyContacts?.[0]?.name}`);
    assert('13. Identification Marks Loaded', p.identificationMarks?.length === 2, `Marks: ${JSON.stringify(p.identificationMarks)}`);

    // Edit Profile Identity Marks & Address
    const updateProfRes = await (await fetch(`${BASE_URL}/patients/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        address: 'Flat 501, Silicon Towers',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        identificationMarks: ['Scar on left forearm', 'Mole on right cheek', 'Birthmark on left shoulder'],
      }),
    })).json();
    assert('14. Update Profile & Identity Marks in PostgreSQL', updateProfRes.success === true && updateProfRes.patient?.identificationMarks?.length === 3);

    // 4. Allergies Tests
    console.log('\n--- Test Phase 4: Allergies Add, Read, Delete ---');
    const addAllergyRes = await (await fetch(`${BASE_URL}/patients/me/allergies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        allergen: 'Amoxicillin',
        severity: 'SEVERE',
        reaction: 'Skin rash, swelling',
        notes: 'Observed during 2021 dental treatment',
      }),
    })).json();
    const createdAllergyId = addAllergyRes.allergy?.id || addAllergyRes.data?.id;
    assert('15. Add Allergy to PostgreSQL', addAllergyRes.success === true && !!createdAllergyId);

    const delAllergyRes = await (await fetch(`${BASE_URL}/patients/me/allergies/${createdAllergyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patientToken}` },
    })).json();
    assert('16. Delete Allergy from PostgreSQL', delAllergyRes.success === true);

    // 5. Medicines & Reminders Tests
    console.log('\n--- Test Phase 5: Medicines, Complete Dose & Stock Decrement ---');
    const addMedRes = await (await fetch(`${BASE_URL}/patients/me/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        medicineName: 'Atorvastatin 10mg',
        dosage: '1 tablet',
        frequency: 'Once daily (Night)',
        timingSlot: 'NIGHT',
        duration: '30 days',
        instructions: 'Take after dinner',
        stock: 15,
      }),
    })).json();
    const createdMed = addMedRes.medicine || addMedRes.data;
    assert('17. Add Patient Medicine to PostgreSQL', addMedRes.success === true && createdMed.currentStock === 15);

    // Complete dose -> stock must decrement by exactly 1
    const completeDoseRes = await (await fetch(`${BASE_URL}/patients/me/medicines/${createdMed.id}/action`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ action: 'COMPLETE', notes: 'Dose taken at bedtime' }),
    })).json();
    const updatedMedAfterDose = completeDoseRes.medicine || completeDoseRes.data;
    assert('18. Complete Dose Decrements Stock by 1', updatedMedAfterDose.currentStock === 14, `Stock: ${updatedMedAfterDose.currentStock}`);

    // Snooze dose -> stock must NOT decrement
    const snoozeDoseRes = await (await fetch(`${BASE_URL}/patients/me/medicines/${createdMed.id}/action`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ action: 'SNOOZE', notes: 'Snoozed 15 mins' }),
    })).json();
    const updatedMedAfterSnooze = snoozeDoseRes.medicine || snoozeDoseRes.data;
    assert('19. Snooze Dose Retains Current Stock (No Decrement)', updatedMedAfterSnooze.currentStock === 14, `Stock: ${updatedMedAfterSnooze.currentStock}`);

    // Verify persistence via GET /patients/me/medicines
    const getMedsRes = await (await fetch(`${BASE_URL}/patients/me/medicines`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })).json();
    const loadedMed = (getMedsRes.medicines || getMedsRes.data || []).find((m) => m.id === createdMed.id);
    assert('20. Medicine Stock Persistence on Reload', loadedMed && loadedMed.currentStock === 14);

    // 6. Appointments & Synchronization Tests
    console.log('\n--- Test Phase 6: Appointments & Doctor Synchronization ---');
    // Login as Doctor to verify cross-sync
    const docLoginRes = await (await fetch(`${BASE_URL}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'TS-MCI-2024-8921', password: 'password123' }),
    })).json();
    assert('21. Doctor Login for Schedule Sync', docLoginRes.success === true && !!docLoginRes.token);
    const doctorToken = docLoginRes.token;
    const doctorId = docLoginRes.doctor?.id || docLoginRes.user?.doctor?.id || docLoginRes.data?.doctor?.id;
    console.log('Doctor Resolved ID:', doctorId);

    // Book appointment for patient
    const randDay = Math.floor(10 + Math.random() * 18);
    const randHour = Math.floor(1 + Math.random() * 12);
    const appDate = `2026-11-${randDay}`;
    const appTime = `${randHour}:00 AM`;
    const bookRes = await (await fetch(`${BASE_URL}/patients/me/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        doctorId,
        date: appDate,
        timeSlot: appTime,
        department: 'Cardiology',
        appointmentType: 'IN_PERSON',
        reason: 'Hypertension evaluation',
      }),
    })).json();
    console.log('bookRes payload:', JSON.stringify(bookRes));
    assert('22. Book Patient Appointment', bookRes.success === true && !!bookRes.appointment);
    const bookedAppId = bookRes.appointment?.id;

    // Prevent double booking on same slot
    const doubleBookRes = await (await fetch(`${BASE_URL}/patients/me/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        doctorId,
        date: appDate,
        timeSlot: appTime,
        department: 'Cardiology',
        appointmentType: 'IN_PERSON',
        reason: 'Duplicate slot test',
      }),
    })).json();
    assert('23. Double Booking Prevention (409 Conflict)', doubleBookRes.success === false, `Error: ${doubleBookRes.error}`);

    // 7. Notifications Tests
    console.log('\n--- Test Phase 7: Notification Badge & Mark Read ---');
    const notifRes = await (await fetch(`${BASE_URL}/patients/me/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })).json();
    const notifs = notifRes.notifications || notifRes.data || [];
    assert('24. Notifications Created on Appointment Booking', notifs.length > 0 && typeof notifRes.unreadCount === 'number', `Count: ${notifs.length}, Unread: ${notifRes.unreadCount}`);

    // Mark single notification read
    if (notifs.length > 0) {
      const markSingleRes = await (await fetch(`${BASE_URL}/patients/me/notifications/${notifs[0].id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${patientToken}` },
      })).json();
      assert('25. Mark Single Notification Read', markSingleRes.success === true);
    }

    // Mark all read
    const markAllRes = await (await fetch(`${BASE_URL}/patients/me/notifications/all/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${patientToken}` },
    })).json();
    assert('26. Mark All Notifications Read', markAllRes.success === true);

    const notifAfterAllRead = await (await fetch(`${BASE_URL}/patients/me/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })).json();
    assert('27. Header Unread Badge Equals 0 after Mark All', notifAfterAllRead.unreadCount === 0);

    // 8. Doctor Patient Search & Privacy Isolation
    console.log('\n--- Test Phase 8: Doctor Patient Search (Identity Only) ---');
    const searchRes = await (await fetch(`${BASE_URL}/doctors/patients/search?query=${healthId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    })).json();
    const searchedPatient = searchRes.patients?.[0];
    assert('28. Doctor Finds Patient by Health ID', !!searchedPatient && searchedPatient.healthId === healthId);
    assert('29. Doctor Initial Search Result Hides Sensitive Medical Data', searchedPatient.bloodGroup === undefined && searchedPatient.allergies === undefined, `Sanitized correctly`);

    // 9. Consent Access Request & Approval Flow
    console.log('\n--- Test Phase 9: EMR Consent Access Grant & Revoke ---');
    const accessReqRes = await (await fetch(`${BASE_URL}/doctors/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        healthId,
        reason: 'Cardiovascular checkup and prescription renewal',
        scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS'],
      }),
    })).json();
    assert('30. Doctor Creates EMR Access Request', accessReqRes.success === true && !!accessReqRes.accessRequest);
    const accessRequestId = accessReqRes.accessRequest?.id;

    // Patient views & approves access request
    const patientPermsRes = await (await fetch(`${BASE_URL}/patients/me/access-permissions`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })).json();
    assert('31. Patient Receives Access Request in Portal', (patientPermsRes.requests || []).some((r) => r.id === accessRequestId));

    const approveRes = await (await fetch(`${BASE_URL}/patients/me/access-requests/${accessRequestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS'],
        durationDays: 3,
      }),
    })).json();
    assert('32. Patient Approves EMR Access with Blockchain Proof', approveRes.success === true && !!approveRes.blockchainTxId);
    const permissionId = approveRes.permission?.id;

    // Patient revokes permission
    const revokeRes = await (await fetch(`${BASE_URL}/patients/me/permissions/${permissionId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ reason: 'Consultation completed' }),
    })).json();
    assert('33. Patient Revokes Access Permission', revokeRes.success === true && !!revokeRes.blockchainTxId);

    // 10. Emergency Access Break-Glass Tests
    console.log('\n--- Test Phase 10: Emergency Break-Glass (2-Hour Expiry) ---');
    const emergencyRes = await (await fetch(`${BASE_URL}/doctors/emergency/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        healthId,
        reason: 'Acute chest pain in ER - urgent evaluation',
      }),
    })).json();
    assert('34. Doctor Initiates Emergency Break-Glass Session', emergencyRes.success === true && !!emergencyRes.emergencySession);
    const expiryDate = new Date(emergencyRes.emergencySession?.autoExpiryTime);
    const durationHours = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60);
    assert('35. Emergency Expiry Strictly 2 Hours', durationHours > 1.9 && durationHours <= 2.05, `Expiry: ${durationHours.toFixed(2)} hrs`);

    // 11. Patient Helpdesk Support Tickets
    console.log('\n--- Test Phase 11: Patient Helpdesk ---');
    const ticketRes = await (await fetch(`${BASE_URL}/patients/me/helpdesk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        subject: 'Correction in Address spelling',
        category: 'PROFILE_CORRECTION',
        description: 'Please update Street name from Silicon to Cyber Gateway',
        priority: 'NORMAL',
      }),
    })).json();
    assert('36. Submit Patient Helpdesk Ticket', ticketRes.success === true && !!ticketRes.ticket);

    const getTicketsRes = await (await fetch(`${BASE_URL}/patients/me/helpdesk`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })).json();
    assert('37. Load Patient Helpdesk Tickets', (getTicketsRes.tickets || []).length > 0);

    // 12. Cross-Patient Isolation Security Test
    console.log('\n--- Test Phase 12: Cross-Patient Security & Ownership Enforcement ---');
    // Register Patient 2
    const mobile2 = '98765' + Math.floor(10000 + Math.random() * 90000);
    const otp2Req = await (await fetch(`${BASE_URL}/auth/patient/registration-request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: mobile2 }),
    })).json();
    await fetch(`${BASE_URL}/auth/patient/registration-verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: mobile2, otp: otp2Req.devOtpHint }),
    });
    const reg2 = await (await fetch(`${BASE_URL}/auth/patient/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: mobile2,
        fullName: 'Second Patient Test',
        dob: '2000-01-01',
        gender: 'FEMALE',
      }),
    })).json();
    const patient2Token = reg2.token;

    // Patient 2 attempts to view Patient 1's medicine action
    const unauthorizedMedAction = await (await fetch(`${BASE_URL}/patients/me/medicines/${createdMed.id}/action`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patient2Token}` },
      body: JSON.stringify({ action: 'COMPLETE' }),
    })).json();
    assert('38. Cross-Patient Medicine Mutation Rejection (404/403 Scoped Isolation)', unauthorizedMedAction.success === false, `Result: ${unauthorizedMedAction.error}`);

    // Summary
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    console.log(`\n========================================`);
    console.log(`E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${results.length})`);
    console.log(`========================================`);
  } catch (err) {
    console.error('Fatal E2E runner error:', err);
  }
}

runE2ETests();
