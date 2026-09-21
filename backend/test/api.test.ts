import { calculateCanonicalSha256 } from '../src/utils/crypto.js';
import { blockchainService } from '../src/services/blockchain.service.js';
import { prisma } from '../src/models/prisma.js';

async function runBackendVerificationTests() {
  console.log('🧪 Starting Backend API & Security Verification Tests...\n');
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
    // 1. Test Canonical JSON Hashing
    console.log('1. Cryptographic Canonical Serialization & Hashing:');
    const payload1 = { b: 2, a: 1, c: { z: 26, y: 25 } };
    const payload2 = { c: { y: 25, z: 26 }, a: 1, b: 2 };
    const hash1 = calculateCanonicalSha256(payload1);
    const hash2 = calculateCanonicalSha256(payload2);
    assert(hash1 === hash2, 'Canonical hashing is order-independent and deterministic');
    assert(hash1.length === 64, 'Produces 64-character SHA-256 hex string');

    // 2. Test Blockchain Service Proof Registration
    console.log('\n2. Blockchain Integrity Proof Registration:');
    const proof = await blockchainService.registerRecordProof({
      recordId: 'TEST-RX-9999',
      recordType: 'PRESCRIPTION',
      eventType: 'RECORD_CREATED',
      payload: { prescriptionId: 'TEST-RX-9999', drug: 'Aspirin 75mg' },
      referenceId: 'HP-100245',
    });
    assert(proof.status === 'VERIFIED', 'Proof status is VERIFIED');
    assert(!!proof.transactionId, 'Generated cryptographic transaction ID');

    // 3. Test Recalculation & Integrity Verification (Match)
    console.log('\n3. Integrity Verification (Untampered Record):');
    const verifyUntampered = await blockchainService.verifyRecordProof({
      recordId: 'TEST-RX-9999',
      recordType: 'PRESCRIPTION',
      currentPayload: { prescriptionId: 'TEST-RX-9999', drug: 'Aspirin 75mg' },
    });
    assert(verifyUntampered.verified === true, 'Untampered record verified successfully (EMR Integrity: VERIFIED)');

    // 4. Test Tampering Detection (Mismatch)
    console.log('\n4. Tampering Detection & Security Alert Generation:');
    const verifyTampered = await blockchainService.verifyRecordProof({
      recordId: 'TEST-RX-9999',
      recordType: 'PRESCRIPTION',
      currentPayload: { prescriptionId: 'TEST-RX-9999', drug: 'Morphine 500mg (Tampered!)' },
    });
    assert(verifyTampered.verified === false, 'Tampered record triggers verification failure');
    assert(verifyTampered.status === 'INTEGRITY_FAILURE', 'Status is INTEGRITY_FAILURE');

    // Check if security alert was automatically recorded in database
    const alert = await prisma.securityAlert.findFirst({
      where: { recordId: 'TEST-RX-9999', alertType: 'HASH_MISMATCH' },
    });
    assert(!!alert && alert.severity === 'HIGH', 'High-severity HASH_MISMATCH SecurityAlert recorded in database');

    // 5. Test Database Seed Data Validity
    console.log('\n5. Database Seed Data Sanity:');
    const rahul = await prisma.patient.findUnique({
      where: { healthId: 'HP-100245' },
      include: { user: true, emergencyContacts: true },
    });
    assert(!!rahul && rahul.fullName === 'Rahul Sharma', 'Patient Rahul (HP-100245) exists');
    assert(rahul?.emergencyContacts.length! >= 2, 'Rahul has emergency contacts configured');

    const drAnanya = await prisma.doctor.findFirst({
      where: { registrationNumber: 'MCI-CARD-2018-8472' },
    });
    assert(drAnanya?.regStatus === 'APPROVED', 'Dr. Ananya Sharma is APPROVED');

    const drPriya = await prisma.doctor.findFirst({
      where: { registrationNumber: 'MCI-DERM-2021-3918' },
    });
    assert(drPriya?.regStatus === 'PENDING', 'Dr. Priya Nair is PENDING verification');

    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    assert(!!admin && admin.email === 'admin@emr-platform.internal', 'Admin user configured and separate');

    console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBackendVerificationTests();
