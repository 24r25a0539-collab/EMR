const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('=== TEST: Patient Authentication & Notification Token Propagation ===');

  // 1. Request OTP for demo patient (e.g. mobile 9876543210 or HealthID HID-2024-9001)
  const reqOtpRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9876543210' }),
  });
  const reqOtpData = await reqOtpRes.json();
  console.log('1. OTP Request Status:', reqOtpRes.status, 'Success:', reqOtpData.success);
  if (!reqOtpData.success) {
    throw new Error('Failed to request OTP: ' + JSON.stringify(reqOtpData));
  }

  // 2. Verify OTP with real dynamically generated OTP
  const generatedOtp = reqOtpData.devOtpHint;
  const verifyRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9876543210', otp: generatedOtp }),
  });
  const verifyData = await verifyRes.json();
  console.log('2. OTP Verify Status:', verifyRes.status, 'Success:', verifyData.success, 'Token Present:', !!verifyData.token);
  if (!verifyData.token) {
    throw new Error('No token returned in verify OTP response');
  }

  const patientToken = verifyData.token;

  // 3. Fetch Notifications with the authenticated JWT
  const notifRes = await fetch(`${BASE_URL}/notifications`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
  });
  const notifData = await notifRes.json();
  console.log('3. Notifications Fetch Status:', notifRes.status);
  console.log('   Success:', notifData.success);
  console.log('   Notifications Count:', notifData.notifications?.length ?? notifData.data?.length ?? 0);
  console.log('   Unread Count:', notifData.unreadCount);

  if (notifRes.status !== 200 || !notifData.success) {
    throw new Error('Notifications request failed with status ' + notifRes.status + ': ' + JSON.stringify(notifData));
  }

  // 4. Test unauthenticated request correctly returns 401 with expected message
  const unauthRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const unauthData = await unauthRes.json();
  console.log('4. Unauthenticated Notifications Status:', unauthRes.status);
  console.log('   Unauthenticated Error Message:', unauthData.message);
  if (unauthRes.status !== 401) {
    throw new Error('Expected 401 for unauthenticated request');
  }

  console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
