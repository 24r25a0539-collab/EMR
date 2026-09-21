async function runFullE2ETests() {
  console.log('🚀 Running Complete End-to-End EMR Platform API Tests...\n');
  const BASE_URL = 'http://localhost:5000/api';
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('1. Service Health Check');
    const healthRes = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    assert(healthRes.status === 'HEALTHY', 'Backend service health is HEALTHY');

    // 2. Patient OTP Verification
    console.log('\n2. Patient Authentication Flow');
    const patientLoginRes = await fetch(`${BASE_URL}/auth/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9876543210', otp: '123456' }),
    }).then((r) => r.json());
    assert(!!patientLoginRes.token, 'Patient login generated JWT session token');
    assert(patientLoginRes.user?.role === 'PATIENT', 'Authenticated user has role PATIENT');
    const patientToken = patientLoginRes.token;

    // 3. Patient Profile Retrieval
    console.log('\n3. Patient Profile & Record Previews');
    const profileRes = await fetch(`${BASE_URL}/patients/me`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    }).then((r) => r.json());
    assert(profileRes.success === true, 'Successfully fetched patient profile');
    assert(profileRes.patient?.healthId === 'HP-100245', 'Retrieved Sovereign Health ID HP-100245');
    assert(profileRes.patient?.fullName === 'Rahul Sharma', 'Patient name matches Rahul Sharma');

    // 4. Doctor Authentication Flow
    console.log('\n4. Doctor Authentication Flow');
    const docLoginRes = await fetch(`${BASE_URL}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'ananya.sharma@apollo.org', password: 'Doctor@123' }),
    }).then((r) => r.json());
    assert(!!docLoginRes.token, 'Doctor login generated JWT session token');
    assert(docLoginRes.user?.role === 'DOCTOR', 'Authenticated user has role DOCTOR');
    const docToken = docLoginRes.token;

    // 5. Doctor Searches Patient
    console.log('\n5. Doctor Searches Patient by Health ID');
    const searchRes = await fetch(`${BASE_URL}/doctors/patients/search?query=HP-100245`, {
      headers: { Authorization: `Bearer ${docToken}` },
    }).then((r) => r.json());
    assert(searchRes.success === true && searchRes.patients?.length > 0, 'Found patient by Health ID HP-100245');

    // 6. Doctor Requests EMR Access
    console.log('\n6. Doctor Requests Standard EMR Access');
    const reqRes = await fetch(`${BASE_URL}/doctors/access-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        patientHealthId: 'HP-100245',
        reason: 'Quarterly cardiology consultation review',
        scopes: ['DIAGNOSES', 'MEDICATIONS', 'LAB_REPORTS'],
        durationHours: 48,
      }),
    }).then((r) => r.json());
    assert(reqRes.success === true, 'Doctor submitted access request successfully');
    const requestId = reqRes.accessRequest?.id;

    // 7. Patient Reviews & Approves Access Request
    console.log('\n7. Patient Reviews & Approves Access Request');
    if (requestId) {
      const approveRes = await fetch(`${BASE_URL}/patients/me/access-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${patientToken}` },
      }).then((r) => r.json());
      assert(approveRes.success === true, 'Patient approved access request; status changed to ACTIVE');
    }

    // 8. Doctor Views Permitted EMR
    console.log('\n8. Doctor Accesses Permitted Patient EMR');
    const emrRes = await fetch(`${BASE_URL}/doctors/patients/pat_rahul_01/emr`, {
      headers: { Authorization: `Bearer ${docToken}` },
    }).then((r) => r.json());
    assert(emrRes.success === true, 'Doctor accessed authorized EMR record');

    // 9. Doctor Emergency Bypass Flow
    console.log('\n9. Doctor Trauma Emergency Bypass (No Prior Consent Required)');
    const emergRes = await fetch(`${BASE_URL}/doctors/emergency/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`,
      },
      body: JSON.stringify({
        healthId: 'HP-100245',
        reason: 'Acute cardiac arrhythmia with syncope in ER Bay 3',
      }),
    }).then((r) => r.json());
    assert(emergRes.success === true, 'Emergency bypass session initiated successfully');
    assert(!!emergRes.session?.id, 'Generated Emergency Session ID');
    assert(emergRes.session?.status === 'ACTIVE', 'Emergency Session status is ACTIVE');
    const sessionId = emergRes.session?.id;

    // 10. Add Emergency Treatment Note
    console.log('\n10. Add Emergency Treatment Note');
    if (sessionId) {
      const noteRes = await fetch(`${BASE_URL}/doctors/emergency/${sessionId}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${docToken}`,
        },
        body: JSON.stringify({
          note: 'Administered IV Amiodarone 150mg. Rhythm converted to normal sinus rhythm. Vitals stabilized.',
        }),
      }).then((r) => r.json());
      assert(noteRes.success === true, 'Emergency treatment note appended');

      // 11. Conclude Emergency Session
      const endRes = await fetch(`${BASE_URL}/doctors/emergency/${sessionId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${docToken}` },
      }).then((r) => r.json());
      assert(endRes.success === true, 'Emergency trauma session concluded and locked');
    }

    // 12. Admin Authentication Flow
    console.log('\n12. Admin Authentication Flow');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@emr.gov.in', password: 'Admin@123456' }),
    }).then((r) => r.json());
    assert(!!adminLoginRes.token, 'Admin login generated JWT session token');
    assert(adminLoginRes.user?.role === 'ADMIN', 'Authenticated user has role ADMIN');
    const adminToken = adminLoginRes.token;

    // 13. Admin Doctor Verification Queue
    console.log('\n13. Admin Doctor Verification Management');
    const docsRes = await fetch(`${BASE_URL}/admin/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(docsRes.success === true && docsRes.doctors?.length > 0, 'Admin fetched doctor registry');
    const pendingDoctor = docsRes.doctors?.find((d: any) => d.verificationStatus === 'PENDING');
    if (pendingDoctor) {
      const verifyRes = await fetch(`${BASE_URL}/admin/doctors/${pendingDoctor.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'APPROVE',
          notes: 'NMC registration checked against state medical registry.',
        }),
      }).then((r) => r.json());
      assert(verifyRes.success === true, `Admin verified doctor ${pendingDoctor.fullName}`);
    }

    // 14. Admin Blockchain Proofs & Tamper Lab
    console.log('\n14. Admin Blockchain Proofs & Tamper Lab Simulation');
    const simRes = await fetch(`${BASE_URL}/admin/blockchain/simulate-tampering`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        recordId: 'LR-2031',
        recordType: 'LabReport',
        tamperedValue: 'Hemoglobin: 3.1 g/dL (Adversary Tampering Injection)',
      }),
    }).then((r) => r.json());
    assert(simRes.tampered === true, 'Tampering simulation successfully detected mismatch');
    assert(simRes.status === 'EMR_INTEGRITY_FAILURE', 'Tampering status is EMR_INTEGRITY_FAILURE');
    assert(simRes.alertGenerated === true, 'Automated High-Severity Security Alert generated');

    // 15. Admin Granular Audit Logs
    console.log('\n15. Admin Granular Append-Only Audit Trail');
    const auditRes = await fetch(`${BASE_URL}/admin/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(auditRes.success === true && auditRes.logs?.length > 0, 'Retrieved granular audit logs');
    assert(
      auditRes.logs?.some((l: any) => l.action.includes('EMERGENCY') || l.action.includes('VIEW')),
      'Audit log contains specific, individual actions (not generic "Record accessed")'
    );

    console.log(`\n====================================================`);
    console.log(`📊 Complete E2E Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`====================================================\n`);
  } catch (err: any) {
    console.error('Test execution failed with error:', err);
  }
}

runFullE2ETests();
