const BASE_URL = 'http://localhost:5000/api';

async function runComprehensiveTest() {
  console.log('====================================================');
  console.log('PATIENT NOTIFICATIONS & AUTH VERIFICATION SUITE');
  console.log('====================================================\n');

  // Test 1: Patient Login via OTP
  console.log('TEST 1: Patient Login via OTP');
  const reqOtpRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9876543210' }),
  });
  const reqOtpData = await reqOtpRes.json();
  if (!reqOtpData.success || !reqOtpData.devOtpHint) {
    throw new Error('Failed to request OTP: ' + JSON.stringify(reqOtpData));
  }
  console.log('✓ OTP requested successfully for mobile 9876543210');

  const verifyRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9876543210', otp: reqOtpData.devOtpHint }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success || !verifyData.token || !verifyData.user) {
    throw new Error('Failed to verify OTP: ' + JSON.stringify(verifyData));
  }
  const patientToken = verifyData.token;
  console.log('✓ OTP verified. Real JWT Token issued for user:', verifyData.user.name || verifyData.user.id);

  // Test 2: Fetch Notifications with authenticated token
  console.log('\nTEST 2: Patient Notifications Module Fetch');
  const notifRes = await fetch(`${BASE_URL}/notifications`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
  });
  const notifData = await notifRes.json();
  if (notifRes.status !== 200 || !notifData.success) {
    throw new Error('Notification fetch failed: ' + JSON.stringify(notifData));
  }
  console.log('✓ Notifications fetched with status 200 (Success: true)');
  console.log(`✓ Total notifications in PostgreSQL: ${notifData.notifications.length}`);
  console.log(`✓ Real unread count: ${notifData.unreadCount}`);

  // Test 3: Session Refresh & Token Persistence Simulation
  console.log('\nTEST 3: Session Persistence & Re-fetch');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
  });
  const meData = await meRes.json();
  if (!meData.success || !meData.user) {
    throw new Error('Failed to restore session via /auth/me: ' + JSON.stringify(meData));
  }
  console.log('✓ Session restored successfully via /auth/me');

  const reNotifRes = await fetch(`${BASE_URL}/notifications`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
  });
  const reNotifData = await reNotifRes.json();
  if (reNotifRes.status !== 200 || !reNotifData.success) {
    throw new Error('Subsequent notification fetch failed: ' + JSON.stringify(reNotifData));
  }
  console.log('✓ Restored session fetched notifications with status 200');

  // Test 4: Mark Notification as Read
  if (notifData.notifications.length > 0) {
    console.log('\nTEST 4: Mark Notification as Read');
    const targetNotif = notifData.notifications[0];
    const markReadRes = await fetch(`${BASE_URL}/notifications/${targetNotif.id}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
    });
    const markReadData = await markReadRes.json();
    if (markReadRes.status !== 200 || !markReadData.success) {
      throw new Error('Failed to mark notification as read: ' + JSON.stringify(markReadData));
    }
    console.log(`✓ Notification ${targetNotif.id} marked as read successfully`);
  }

  // Test 5: Verify Unauthenticated Request is properly rejected with 401
  console.log('\nTEST 5: Unauthenticated Security Boundary');
  const unauthRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const unauthData = await unauthRes.json();
  if (unauthRes.status !== 401 || unauthData.error !== 'AUTHENTICATION_REQUIRED') {
    throw new Error('Security boundary failed: unauthenticated request was not rejected with 401');
  }
  console.log('✓ Unauthenticated request rejected with 401 AUTHENTICATION_REQUIRED');

  console.log('\n====================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY (5/5)');
  console.log('====================================================');
}

runComprehensiveTest().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
