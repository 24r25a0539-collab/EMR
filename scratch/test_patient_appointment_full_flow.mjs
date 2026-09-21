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

async function runAppointmentTests() {
  console.log('========================================================================');
  console.log('APEX EMR — PATIENT APPOINTMENT FLOW & REAL POSTGRESQL DATA TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // ------------------------------------------------------------------------
  // 1. REGISTER REAL PATIENT
  // ------------------------------------------------------------------------
  console.log('--- 1. Registering Real Patient in DB ---');
  const patientMobile = '98491' + Math.floor(10000 + Math.random() * 90000);
  const patientEmail = `kalyan.${Date.now()}@test.com`;
  const patientAbha = '91' + Date.now().toString().slice(-12);

  const patRegRes = await req('/auth/patient/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Kalyan Kumar',
      dob: '1992-06-15',
      gender: 'Male',
      mobile: patientMobile,
      email: patientEmail,
      bloodGroup: 'O+',
      abhaId: patientAbha,
      allergies: 'None',
      conditions: 'None',
      address: 'Plot 42, Jubilee Hills, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      govtIdType: 'AADHAAR',
      govtIdNumber: '998877665544',
      identificationMarks: ['Small mole on right cheek'],
      emergencyContactName: 'Lakshmi Kumar',
      emergencyContactPhone: '9849199999',
      emergencyContactRelation: 'Spouse',
    }),
  });

  assert(patRegRes.status === 201 && patRegRes.data.success, 'Patient registered successfully in PostgreSQL', `Token: ${!!patRegRes.data.token}, HealthID: ${patRegRes.data.healthId || patRegRes.data.patient?.healthId}`);
  const patientToken = patRegRes.data.token;
  const patientId = patRegRes.data.patient?.id || patRegRes.data.data?.id;

  // ------------------------------------------------------------------------
  // 2. FETCH REAL APPROVED DOCTORS DIRECTORY
  // ------------------------------------------------------------------------
  console.log('\n--- 2. Fetching Real Approved Doctors Directory ---');
  const docDirRes = await req('/doctors');
  assert(docDirRes.status === 200 && Array.isArray(docDirRes.data.doctors), 'GET /doctors returns approved doctors list', `Total: ${docDirRes.data.doctors?.length}`);
  assert(docDirRes.data.doctors.length > 0, 'Doctors directory contains approved database records');

  // Pick a real doctor that is NOT Dr. Sharma to strictly test non-hardcoded doctor selection
  const nonSharmaDoctor = docDirRes.data.doctors.find(d => !d.fullName.includes('Sharma') && d.regStatus === 'APPROVED');
  assert(!!nonSharmaDoctor, 'Found non-Sharma approved doctor in PostgreSQL', `Name: ${nonSharmaDoctor?.fullName}, ID: ${nonSharmaDoctor?.id}`);

  // ------------------------------------------------------------------------
  // 3. FETCH SINGLE DOCTOR BY ID
  // ------------------------------------------------------------------------
  console.log('\n--- 3. Fetching Single Doctor by ID ---');
  const singleDocRes = await req(`/doctors/${nonSharmaDoctor.id}`);
  assert(singleDocRes.status === 200 && singleDocRes.data.doctor?.id === nonSharmaDoctor.id, 'GET /doctors/:id returns matching doctor from DB', singleDocRes.data.doctor?.fullName);

  // ------------------------------------------------------------------------
  // 4. ATTEMPT BOOKING WITH INVALID DOCTOR ID (VERIFY NO DR. SHARMA FALLBACK)
  // ------------------------------------------------------------------------
  console.log('\n--- 4. Verify Invalid Doctor ID Does NOT Fall Back to Dr. Sharma ---');
  const fakeDocRes = await req('/patients/me/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      doctorId: '00000000-0000-0000-0000-000000000000',
      date: '2026-11-15',
      timeSlot: '10:00 AM',
      appointmentType: 'IN_PERSON',
      reason: 'General checkup',
    }),
  });
  assert(fakeDocRes.status === 404 && !fakeDocRes.data.success, 'Booking with invalid doctor ID rejected with 404 (No Dr. Sharma fallback)', fakeDocRes.data.error);

  // ------------------------------------------------------------------------
  // 5. FETCH BOOKED SLOTS BEFORE BOOKING
  // ------------------------------------------------------------------------
  console.log('\n--- 5. Checking Available Slots for Doctor & Date ---');
  const testDate = '2026-11-20';
  const testSlot = '10:30 AM';
  const slotsBefore = await req(`/doctors/${nonSharmaDoctor.id}/booked-slots?date=${testDate}`);
  assert(slotsBefore.status === 200 && Array.isArray(slotsBefore.data.bookedSlots), 'GET /doctors/:id/booked-slots returns slots array');

  // ------------------------------------------------------------------------
  // 6. BOOK REAL APPOINTMENT IN POSTGRESQL FOR SELECTED DOCTOR
  // ------------------------------------------------------------------------
  console.log('\n--- 6. Booking Appointment in PostgreSQL for Selected Doctor ---');
  const bookRes = await req('/patients/me/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      doctorId: nonSharmaDoctor.id,
      date: testDate,
      timeSlot: testSlot,
      appointmentType: 'IN_PERSON',
      reason: 'Specialist consultation for neurological evaluation',
    }),
  });

  assert(bookRes.status === 201 && bookRes.data.success, 'Appointment created in PostgreSQL', `Number: ${bookRes.data.appointment?.appointmentNumber}`);
  assert(bookRes.data.appointment?.doctorId === nonSharmaDoctor.id, 'Appointment stored with exact selected Doctor ID');
  assert(bookRes.data.appointment?.patientId === patientId, 'Appointment stored with exact authenticated Patient ID');
  assert(bookRes.data.appointment?.status === 'CONFIRMED', 'Appointment initial status is CONFIRMED');
  const createdAptId = bookRes.data.appointment?.id;

  // ------------------------------------------------------------------------
  // 7. VERIFY DOUBLE BOOKING IS PREVENTED
  // ------------------------------------------------------------------------
  console.log('\n--- 7. Verifying Double-Booking Prevention ---');
  const doubleBookRes = await req('/patients/me/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      doctorId: nonSharmaDoctor.id,
      date: testDate,
      timeSlot: testSlot,
      appointmentType: 'IN_PERSON',
      reason: 'Another patient or same patient trying same slot',
    }),
  });
  assert(doubleBookRes.status === 409 && !doubleBookRes.data.success, 'Double booking rejected with HTTP 409 Conflict', doubleBookRes.data.error);

  // Verify slot now appears in booked slots endpoint
  const slotsAfter = await req(`/doctors/${nonSharmaDoctor.id}/booked-slots?date=${testDate}`);
  assert(slotsAfter.data.bookedSlots?.includes(testSlot), 'Booked slot now marked unavailable in booked-slots API');

  // ------------------------------------------------------------------------
  // 8. FETCH PATIENT APPOINTMENTS (VERIFY POSTGRESQL PERSISTENCE)
  // ------------------------------------------------------------------------
  console.log('\n--- 8. Fetching Patient Appointments List from PostgreSQL ---');
  const patAptsRes = await req('/patients/me/appointments', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(patAptsRes.status === 200 && Array.isArray(patAptsRes.data.appointments), 'GET /patients/me/appointments returns list');
  const foundApt = patAptsRes.data.appointments.find(a => a.id === createdAptId);
  assert(!!foundApt, 'Newly created appointment appears in Patient Appointments list');
  assert(foundApt?.doctor?.fullName === nonSharmaDoctor.fullName, 'Appointment doctor matches selected doctor', foundApt?.doctor?.fullName);
  assert(foundApt?.date === testDate && foundApt?.timeSlot === testSlot, 'Appointment date and time match selected date/time');

  // ------------------------------------------------------------------------
  // 9. TEST APPOINTMENT CANCELLATION & STATUS UPDATE IN POSTGRESQL
  // ------------------------------------------------------------------------
  console.log('\n--- 9. Cancelling Appointment & Verifying Status Update ---');
  const cancelRes = await req(`/patients/me/appointments/${createdAptId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ reason: 'Rescheduling travel' }),
  });
  assert(cancelRes.status === 200 && cancelRes.data.appointment?.status === 'CANCELLED', 'Appointment status updated to CANCELLED in DB');

  // Re-fetch patient appointments to verify updated status
  const refreshedApts = await req('/patients/me/appointments', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const cancelledApt = refreshedApts.data.appointments.find(a => a.id === createdAptId);
  assert(cancelledApt?.status === 'CANCELLED', 'Patient appointments page reflects updated status (CANCELLED) from DB');

  // ------------------------------------------------------------------------
  // 10. VERIFY REAL APPOINTMENT NOTIFICATIONS IN POSTGRESQL
  // ------------------------------------------------------------------------
  console.log('\n--- 10. Verifying Real Notifications in PostgreSQL ---');
  const notifRes = await req('/patients/me/notifications', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(notifRes.status === 200 && Array.isArray(notifRes.data.notifications), 'GET /patients/me/notifications returns real DB notifications');
  const aptNotif = notifRes.data.notifications.find(n => n.type === 'APPOINTMENT' || n.category === 'APPOINTMENT');
  assert(!!aptNotif, 'Patient received real appointment confirmation notification in PostgreSQL', aptNotif?.title);

  // ------------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAppointmentTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
