import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-emr-platform-jwt-secret-key-change-in-production-2026';

async function main() {
  console.log('=== STARTING LAB REPORT PERSISTENCE & PRIVACY VERIFICATION SUITE ===\n');

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
    // 1. Fetch Patient A and Patient B
    const patientUsers = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      include: { patient: true },
      take: 2,
    });

    const patientAUser = patientUsers[0];
    const patientAPatient = patientUsers[0].patient;
    const patientBUser = patientUsers[1];
    const patientBPatient = patientUsers[1].patient;

    const tokenA = jwt.sign({ id: patientAUser.id, role: 'PATIENT' }, JWT_SECRET, { expiresIn: '1d' });
    const tokenB = jwt.sign({ id: patientBUser.id, role: 'PATIENT' }, JWT_SECRET, { expiresIn: '1d' });

    console.log(`Patient A: ${patientAPatient.fullName} (${patientAPatient.healthId})`);
    console.log(`Patient B: ${patientBPatient.fullName} (${patientBPatient.healthId})\n`);

    // TEST 1: Patient A uploads a new Lab Report
    console.log('[TEST 1] Patient uploads Lab Report & PostgreSQL Persistence');
    const uploadPayload = {
      testName: 'Complete Metabolic Panel & Serum Electrolytes',
      category: 'Biochemistry',
      laboratoryName: 'Apex Diagnostic Pathology Lab',
      sampleDate: '2026-09-20',
      resultDate: '2026-09-20',
      summary: 'Electrolyte levels within standard physiological bounds. Glucose fasting: 92 mg/dL.',
      findings: [
        { name: 'Sodium', value: '138', unit: 'mEq/L', refRange: '135-145', status: 'normal' },
        { name: 'Potassium', value: '4.2', unit: 'mEq/L', refRange: '3.5-5.0', status: 'normal' },
        { name: 'Chloride', value: '101', unit: 'mEq/L', refRange: '96-106', status: 'normal' },
      ],
      fileSize: '2.1 MB',
      fileType: 'application/pdf',
      recordHash: 'a7c4915b80e81c7423984024b42b938cb8876c5b058097d62058b7608db14210',
    };

    const uploadRes = await fetch(`${BASE_URL}/patients/me/lab-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(uploadPayload),
    }).then((r) => r.json());

    assert(uploadRes.success === true, 'Upload lab report returned HTTP 201 success');
    assert(!!uploadRes.report?.id, `Created Lab Report ID: ${uploadRes.report?.id}`);
    const createdReportId = uploadRes.report.id;

    // Verify record in PostgreSQL directly
    const dbReport = await prisma.labReport.findUnique({ where: { id: createdReportId } });
    assert(!!dbReport, 'Report exists directly in PostgreSQL table `LabReport`');
    assert(dbReport.patientId === patientAPatient.id, 'Report.patientId matches authenticated Patient A');

    // TEST 2: Patient refreshes / queries Lab Reports
    console.log('\n[TEST 2] Fetch Lab Reports (Simulated Refresh)');
    const labListRes = await fetch(`${BASE_URL}/patients/me/lab-reports`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());

    assert(labListRes.success === true, 'GET /patients/me/lab-reports returns success: true');
    const matchedInLabs = labListRes.reports.find((r) => r.id === createdReportId);
    assert(!!matchedInLabs, 'Newly uploaded report remains visible in Lab Reports list after refresh');
    assert(matchedInLabs.testName === uploadPayload.testName, 'Report test name matches uploaded data');

    // TEST 3: Access & Privacy / Document Privacy includes the same real record
    console.log('\n[TEST 3] Lab Report Visibility in Document Privacy');
    const docListRes = await fetch(`${BASE_URL}/patients/me/documents`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());

    assert(docListRes.success === true, 'GET /patients/me/documents returns success: true');
    const matchedInDocs = docListRes.documents.find((d) => d.id === createdReportId);
    assert(!!matchedInDocs, 'Same database Lab Report appears in Document Privacy section');
    assert(matchedInDocs.category === 'Lab Report', 'Category is Lab Report');

    // TEST 4: Access & Privacy Permissions API check
    console.log('\n[TEST 4] Access Permissions API Health');
    const permRes = await fetch(`${BASE_URL}/patients/me/access-permissions`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());
    assert(permRes.success === true, 'GET /patients/me/access-permissions returns success: true without error');
    assert(Array.isArray(permRes.requests), 'Contains requests array from PostgreSQL');
    assert(Array.isArray(permRes.permissions), 'Contains permissions array from PostgreSQL');

    // TEST 5: Change Access Level to PRIVATE
    console.log('\n[TEST 5] Modify Access Level: NORMAL -> PRIVATE with Audit');
    const privacyChangeRes = await fetch(`${BASE_URL}/patients/me/documents/${createdReportId}/privacy`, {
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

    assert(privacyChangeRes.success === true, 'Document privacy updated to PRIVATE in PostgreSQL');

    // Verify in DB
    const updatedDbReport = await prisma.labReport.findUnique({ where: { id: createdReportId } });
    assert(updatedDbReport.summary.includes('VISIBILITY:PRIVATE'), 'PostgreSQL record updated with [VISIBILITY:PRIVATE]');

    // Verify Audit Event created
    const auditEvent = await prisma.auditEvent.findFirst({
      where: {
        documentId: createdReportId,
        actorId: patientAUser.id,
        action: 'MODIFY',
      },
      orderBy: { timestamp: 'desc' },
    });
    assert(!!auditEvent, 'Real AuditEvent created for privacy modification');

    // TEST 6: Simulated Logout / Login & Persistence Re-check
    console.log('\n[TEST 6] Persistence across Login / Refresh');
    const newTokenA = jwt.sign({ id: patientAUser.id, role: 'PATIENT' }, JWT_SECRET, { expiresIn: '1d' });
    const recheckDocRes = await fetch(`${BASE_URL}/patients/me/documents`, {
      headers: { Authorization: `Bearer ${newTokenA}` },
    }).then((r) => r.json());
    const recheckDoc = recheckDocRes.documents.find((d) => d.id === createdReportId);
    assert(!!recheckDoc, 'Report remains in Document Privacy after new session login');
    assert(recheckDoc.visibility === 'PRIVATE', 'Visibility remains PRIVATE from PostgreSQL');

    // TEST 7: Cross-Patient Isolation
    console.log('\n[TEST 7] Cross-Patient Data Isolation');
    const patientBDocs = await fetch(`${BASE_URL}/patients/me/documents`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    }).then((r) => r.json());
    const patientBHasA = patientBDocs.documents.some((d) => d.id === createdReportId);
    assert(!patientBHasA, 'Patient B CANNOT see Patient A lab report');

    const patientBUnauthAccess = await fetch(`${BASE_URL}/patients/me/documents/${createdReportId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(patientBUnauthAccess.status === 404 || patientBUnauthAccess.status === 403, `Patient B direct access attempt rejected (HTTP ${patientBUnauthAccess.status})`);

    const patientBUnauthModify = await fetch(`${BASE_URL}/patients/me/documents/${createdReportId}/privacy`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ visibility: 'NORMAL' }),
    });
    assert(patientBUnauthModify.status === 404 || patientBUnauthModify.status === 403, `Patient B privacy modification attempt on Patient A document rejected (HTTP ${patientBUnauthModify.status})`);

    console.log(`\n========================================`);
    console.log(`ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
