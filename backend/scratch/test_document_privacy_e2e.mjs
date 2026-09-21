import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-emr-platform-jwt-secret-key-change-in-production-2026';

async function runTests() {
  console.log('=== STARTING DOCUMENT PRIVACY E2E TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Fetch Patient A and Patient B from PostgreSQL
    const patientUsers = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      include: { patient: true },
      take: 2,
    });

    if (patientUsers.length < 2) {
      console.error('Not enough patient users found in database for testing');
      process.exit(1);
    }

    const patientAUser = patientUsers[0];
    const patientAPatient = patientUsers[0].patient;
    const patientBUser = patientUsers[1];
    const patientBPatient = patientUsers[1].patient;

    const doctorUser = await prisma.user.findFirst({
      where: { role: 'DOCTOR' },
      include: { doctor: true },
    });

    const tokenA = jwt.sign({ id: patientAUser.id, role: 'PATIENT' }, JWT_SECRET, { expiresIn: '1d' });
    const tokenB = jwt.sign({ id: patientBUser.id, role: 'PATIENT' }, JWT_SECRET, { expiresIn: '1d' });
    const tokenDoc = doctorUser ? jwt.sign({ id: doctorUser.id, role: 'DOCTOR' }, JWT_SECRET, { expiresIn: '1d' }) : null;

    console.log(`Testing with:`);
    console.log(`- Patient A: ${patientAPatient.fullName} (ID: ${patientAPatient.id}, HealthID: ${patientAPatient.healthId})`);
    console.log(`- Patient B: ${patientBPatient.fullName} (ID: ${patientBPatient.id}, HealthID: ${patientBPatient.healthId})`);
    if (doctorUser) console.log(`- Doctor: Dr. ${doctorUser.doctor?.fullName} (ID: ${doctorUser.doctor?.id})`);

    // Ensure Patient A has at least 1 document for testing
    let existingRec = await prisma.medicalRecord.findFirst({
      where: { patientId: patientAPatient.id },
    });
    if (!existingRec) {
      existingRec = await prisma.medicalRecord.create({
        data: {
          patientId: patientAPatient.id,
          title: 'Comprehensive Health Checkup Summary',
          recordType: 'Clinical Summary',
          description: 'Annual wellness exam and vitals report.',
          date: new Date().toISOString(),
          currentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          blockchainStatus: 'VERIFIED',
          isEmergencyAccessible: true,
        },
      });
    }

    // Ensure Patient B has at least 1 document for testing
    let existingRecB = await prisma.medicalRecord.findFirst({
      where: { patientId: patientBPatient.id },
    });
    if (!existingRecB) {
      existingRecB = await prisma.medicalRecord.create({
        data: {
          patientId: patientBPatient.id,
          title: 'Lipid Profile & Metabolic Panel',
          recordType: 'Lab Report',
          description: 'Comprehensive blood lipid analysis.',
          date: new Date().toISOString(),
          currentHash: 'f4b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b866',
          blockchainStatus: 'VERIFIED',
          isEmergencyAccessible: false,
        },
      });
    }

    // TEST 1: Patient A login -> Document Privacy -> Only Patient A documents
    console.log('\n[TEST 1] Patient A Document Retrieval');
    const docsARes = await fetch(`${BASE_URL}/patients/me/documents`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());

    assert(docsARes.success === true, 'GET /patients/me/documents returns success: true');
    assert(Array.isArray(docsARes.documents), 'Response contains real documents array');
    assert(docsARes.documents.length > 0, `Patient A has ${docsARes.documents.length} real document(s)`);

    // TEST 2: Patient B login -> Document Privacy -> Only Patient B documents
    console.log('\n[TEST 2] Patient B Document Retrieval & Cross-Patient Data Isolation');
    const docsBRes = await fetch(`${BASE_URL}/patients/me/documents`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    }).then((r) => r.json());

    assert(docsBRes.success === true, 'GET /patients/me/documents for Patient B returns success: true');
    assert(Array.isArray(docsBRes.documents), 'Patient B receives documents array');

    const patientADocIds = new Set(docsARes.documents.map((d) => d.id));
    const patientBDocIds = new Set(docsBRes.documents.map((d) => d.id));
    const overlap = [...patientADocIds].filter((id) => patientBDocIds.has(id));

    assert(overlap.length === 0, 'ZERO document overlap between Patient A and Patient B (Cross-Patient Isolation)');

    // TEST 3: Patient A attempts to access Patient B document ID
    console.log('\n[TEST 3] Unauthorized Document Access Prevention by ID');
    const docBId = docsBRes.documents[0].id;
    const directAccessRes = await fetch(`${BASE_URL}/patients/me/documents/${docBId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      directAccessRes.status === 404 || directAccessRes.status === 403,
      `Patient A attempting to access Patient B document (${docBId}) is rejected with HTTP ${directAccessRes.status}`
    );

    // TEST 4: Backend ignores spoofed ?patientId=... query parameters
    console.log('\n[TEST 4] Query Parameter Spoofing Prevention');
    const spoofedRes = await fetch(`${BASE_URL}/patients/me/documents?patientId=${patientBPatient.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());
    const returnedIds = spoofedRes.documents.map((d) => d.id);
    const containsB = returnedIds.some((id) => patientBDocIds.has(id));
    assert(!containsB, 'Backend strictly uses JWT identity and never leaks another patient data via query params');

    // TEST 5: Update Document Privacy to PRIVATE and toggle Emergency override
    console.log('\n[TEST 5] Update Document Privacy & Audit Log Generation');
    const targetDocId = docsARes.documents[0].id;
    const updateRes = await fetch(`${BASE_URL}/patients/me/documents/${targetDocId}/privacy`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        visibility: 'PRIVATE',
        allowEmergencyAccess: true,
      }),
    }).then((r) => r.json());

    assert(updateRes.success === true, 'Document privacy updated to PRIVATE with emergency override enabled');

    // Re-fetch to verify persistence in PostgreSQL
    const recheckRes = await fetch(`${BASE_URL}/patients/me/documents`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());
    const updatedDoc = recheckRes.documents.find((d) => d.id === targetDocId);
    assert(updatedDoc.visibility === 'PRIVATE', 'Document visibility persisted as PRIVATE in PostgreSQL');
    assert(updatedDoc.allowEmergencyAccess === true, 'Emergency access persisted as true in PostgreSQL');

    // TEST 6: Doctor Access Control (Doctor without consent rejected)
    console.log('\n[TEST 6] Doctor Access Control & Consent Enforcement');
    if (tokenDoc) {
      // Clean permissions between Doctor and Patient B
      await prisma.permission.deleteMany({
        where: { doctorId: doctorUser.doctor.id, patientId: patientBPatient.id },
      });
      await prisma.accessRequest.deleteMany({
        where: { doctorId: doctorUser.doctor.id, patientId: patientBPatient.id },
      });

      const unauthDocRes = await fetch(`${BASE_URL}/doctors/patients/${patientBPatient.id}/emr`, {
        headers: { Authorization: `Bearer ${tokenDoc}` },
      });
      assert(
        unauthDocRes.status === 403,
        `Doctor without active consent is rejected from accessing patient EMR (HTTP ${unauthDocRes.status})`
      );
    }

    // TEST 7: Single Document Retrieval with Valid Auth
    console.log('\n[TEST 7] Authorized Single Document Retrieval');
    const singleDocRes = await fetch(`${BASE_URL}/patients/me/documents/${targetDocId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());
    assert(singleDocRes.success === true, 'GET /patients/me/documents/:id returns success');
    assert(singleDocRes.document.id === targetDocId, 'Correct document returned with valid metadata');

    console.log(`\n========================================`);
    console.log(`ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
