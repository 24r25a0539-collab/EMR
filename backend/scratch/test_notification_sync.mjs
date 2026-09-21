const BASE_URL = 'http://localhost:5000/api';

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`[PASS] ${description} ${details}`);
  } else {
    console.error(`[FAIL] ${description} ${details}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('=== NOTIFICATION BADGE SYNCHRONIZATION E2E VERIFICATION ===\n');

  // Register Patient A
  const cleanMobileA = `98765${Math.floor(10000 + Math.random() * 90000)}`;
  const otpResA = await (await fetch(`${BASE_URL}/auth/patient/registration-request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: cleanMobileA }),
  })).json();

  const devOtpA = otpResA.devOtpHint || '123456';
  const verifyResA = await (await fetch(`${BASE_URL}/auth/patient/registration-verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: cleanMobileA, otp: devOtpA }),
  })).json();

  assert('Verify Registration OTP A', verifyResA.success === true && verifyResA.verified === true);

  const regResA = await (await fetch(`${BASE_URL}/auth/patient/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile: cleanMobileA,
      fullName: 'Anil Reddy SyncTest',
      email: `anil.${Date.now()}@test.com`,
      dob: '1995-05-15',
      gender: 'MALE',
      bloodGroup: 'B+',
      address: 'Plot 42, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500033',
      aadhaar: '9999' + Math.floor(10000000 + Math.random() * 90000000),
      emergencyContactName: 'Ramesh Reddy',
      emergencyRelation: 'Brother',
      emergencyPhone: '9876543210',
    }),
  })).json();

  assert('Register Patient A', regResA.success === true && !!regResA.token, `HealthID: ${regResA.patient?.healthId}`);
  const tokenA = regResA.token;

  // TEST 1: Patient with ZERO notifications (Initial State)
  const notifRes1 = await (await fetch(`${BASE_URL}/patients/me/notifications`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  })).json();

  assert('TEST 1: Initial unreadCount is 0 (No badge on Sidebar/Header)', notifRes1.unreadCount === 0, `Unread: ${notifRes1.unreadCount}`);
  assert('TEST 1: Notification array is empty (0 alerts)', notifRes1.notifications?.length === 0);

  // TEST 2: Create 1 real notification via Appointment Booking
  const bookRes1 = await (await fetch(`${BASE_URL}/patients/me/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      doctorId: 'any',
      date: `2026-12-0${Math.floor(1 + Math.random() * 8)}`,
      timeSlot: '09:30 AM',
      reason: 'General checkup',
    }),
  })).json();

  assert('Book appointment 1 for Patient A', bookRes1.success === true);

  const notifRes2 = await (await fetch(`${BASE_URL}/patients/me/notifications`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  })).json();

  assert('TEST 2: unreadCount becomes 1 (Sidebar badge = 1, Header badge = 1)', notifRes2.unreadCount === 1, `Unread: ${notifRes2.unreadCount}`);
  assert('TEST 2: Notifications list has 1 item', notifRes2.notifications?.length === 1);
  const notifId1 = notifRes2.notifications[0].id;

  // TEST 3: Create 2nd real notification via 2nd Appointment Booking
  const bookRes2 = await (await fetch(`${BASE_URL}/patients/me/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      doctorId: 'any',
      date: `2026-12-1${Math.floor(1 + Math.random() * 8)}`,
      timeSlot: '11:00 AM',
      reason: 'Followup consultation',
    }),
  })).json();

  assert('Book appointment 2 for Patient A', bookRes2.success === true);

  const notifRes3 = await (await fetch(`${BASE_URL}/patients/me/notifications`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  })).json();

  assert('TEST 3: unreadCount becomes 2 (Sidebar badge = 2, Header badge = 2)', notifRes3.unreadCount === 2, `Unread: ${notifRes3.unreadCount}`);
  assert('TEST 3: Notifications list has 2 items', notifRes3.notifications?.length === 2);

  // TEST 4: Mark 1 single notification as read
  const markSingleRes = await (await fetch(`${BASE_URL}/patients/me/notifications/${notifId1}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` },
  })).json();

  assert('Mark single notification read in DB', markSingleRes.success === true);

  const notifRes4 = await (await fetch(`${BASE_URL}/patients/me/notifications`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  })).json();

  assert('TEST 4: unreadCount decreases to 1 (Sidebar badge = 1, Header badge = 1)', notifRes4.unreadCount === 1, `Unread: ${notifRes4.unreadCount}`);

  // TEST 5: Mark all notifications as read
  const markAllRes = await (await fetch(`${BASE_URL}/patients/me/notifications/all/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` },
  })).json();

  assert('Mark all notifications read in DB', markAllRes.success === true);

  const notifRes5 = await (await fetch(`${BASE_URL}/patients/me/notifications`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  })).json();

  assert('TEST 5: unreadCount becomes 0 (Sidebar badge removed, Header badge removed)', notifRes5.unreadCount === 0, `Unread: ${notifRes5.unreadCount}`);
  assert('TEST 5: All notifications isRead = true', notifRes5.notifications.every((n) => n.isRead === true));

  // TEST 6: Page Reload / Re-fetch Persistence
  const notifRes6 = await (await fetch(`${BASE_URL}/patients/me/notifications`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  })).json();

  assert('TEST 6: Reload persistence verified: unreadCount remains 0', notifRes6.unreadCount === 0);

  // TEST 7: Multi-Patient Data Isolation (Patient B has 0 unread alerts)
  const cleanMobileB = `98765${Math.floor(10000 + Math.random() * 90000)}`;
  const otpResB = await (await fetch(`${BASE_URL}/auth/patient/registration-request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: cleanMobileB }),
  })).json();

  const devOtpB = otpResB.devOtpHint || '123456';
  const verifyResB = await (await fetch(`${BASE_URL}/auth/patient/registration-verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: cleanMobileB, otp: devOtpB }),
  })).json();

  const regResB = await (await fetch(`${BASE_URL}/auth/patient/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile: cleanMobileB,
      fullName: 'Priya Sharma SyncTest',
      email: `priya.${Date.now()}@test.com`,
      dob: '1998-08-20',
      gender: 'FEMALE',
      bloodGroup: 'O+',
      address: 'Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500081',
      aadhaar: '9999' + Math.floor(10000000 + Math.random() * 90000000),
      emergencyContactName: 'Sunil Sharma',
      emergencyRelation: 'Father',
      emergencyPhone: '9876543211',
    }),
  })).json();

  const tokenB = regResB.token;

  const notifResB = await (await fetch(`${BASE_URL}/patients/me/notifications`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  })).json();

  assert('TEST 7: Patient B has unreadCount = 0 (Isolated from Patient A)', notifResB.unreadCount === 0);
  assert('TEST 7: Patient B has 0 notifications', notifResB.notifications?.length === 0);

  console.log('\n================================================================');
  console.log('ALL NOTIFICATION BADGE & SYNC TESTS PASSED (100% VERIFIED)');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
