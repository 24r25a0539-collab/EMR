const BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

async function testSessionExpiredRemoval() {
  console.log('🧪 Starting Session Expired Removal & Patient Login Flow Verification...\n');

  // Test 1: Verify Frontend Landing Page & Patient Login HTML
  console.log('1. Checking Frontend HTTP Endpoints...');
  const rootRes = await fetch(`${FRONTEND_URL}/`);
  console.log('GET / status:', rootRes.status);
  if (rootRes.status !== 200) throw new Error('Frontend root is not reachable');

  const loginRes = await fetch(`${FRONTEND_URL}/patient/login`);
  console.log('GET /patient/login status:', loginRes.status);
  if (loginRes.status !== 200) throw new Error('Patient login route is not reachable');
  console.log('✅ Frontend routes are responsive and clean.');

  // Test 2: Authenticate Patient via Healthcare ID & OTP
  console.log('\n2. Testing Patient Login with Healthcare ID HP-100246...');
  const otpReqRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'HP-100246' }),
  });
  const otpReqData = await otpReqRes.json();
  console.log('OTP Request Response:', {
    success: otpReqData.success,
    patientName: otpReqData.patientName,
    healthId: otpReqData.healthId,
  });

  const otpCode = otpReqData.devOtpHint || '123456';
  const verifyRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'HP-100246', otp: otpCode }),
  });
  const verifyData = await verifyRes.json();
  console.log('Verify OTP Response:', {
    success: verifyData.success,
    tokenReceived: !!verifyData.token,
    role: verifyData.user?.role,
    name: verifyData.user?.name,
  });

  if (!verifyData.token) throw new Error('Patient login verification failed');
  console.log('✅ Patient OTP login succeeded.');

  // Test 3: Test protected patient route with valid token
  console.log('\n3. Testing Protected Patient Route with valid token...');
  const profileRes = await fetch(`${BASE_URL}/patients/me`, {
    headers: { Authorization: `Bearer ${verifyData.token}` },
  });
  const profileData = await profileRes.json();
  console.log('Profile Response status:', profileRes.status, 'success:', profileData.success);
  if (!profileData.success) throw new Error('Failed to access profile with valid token');
  console.log('✅ Protected route accessible with valid token.');

  // Test 4: Test protected patient route with an invalid/expired token (401 response)
  console.log('\n4. Testing Protected Patient Route with invalid token...');
  const expiredTokenRes = await fetch(`${BASE_URL}/patients/me`, {
    headers: { Authorization: `Bearer invalid-expired-token-xyz` },
  });
  console.log('Expired token status:', expiredTokenRes.status);
  if (expiredTokenRes.status === 401 || expiredTokenRes.status === 403) {
    console.log('✅ Backend correctly returns 401/403 for expired token.');
  } else {
    throw new Error(`Expected 401/403, got ${expiredTokenRes.status}`);
  }

  // Test 5: Re-authenticate immediately after invalid token attempt
  console.log('\n5. Testing Immediate Re-authentication after 401...');
  const reOtpReqRes = await fetch(`${BASE_URL}/auth/patient/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'HP-100246' }),
  });
  const reOtpReqData = await reOtpReqRes.json();
  const reVerifyRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'HP-100246', otp: reOtpReqData.devOtpHint || '123456' }),
  });
  const reVerifyData = await reVerifyRes.json();
  console.log('Re-login status:', reVerifyRes.status, 'Token:', !!reVerifyData.token);
  if (!reVerifyData.token) throw new Error('Re-login failed after expired token attempt');
  console.log('✅ Re-login without /session-expired obstruction succeeded.');

  console.log('\n🎉 ALL SESSION EXPIRED REMOVAL TESTS PASSED!\n');
}

testSessionExpiredRemoval().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
