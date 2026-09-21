import { prisma } from '../src/models/prisma.js';
import { doctorController } from '../src/controllers/doctor.controller.js';

function mockReqRes(user: any, body: any = {}, params: any = {}, query: any = {}) {
  const req: any = {
    user,
    body,
    params,
    query,
    ip: '127.0.0.1',
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
    getStatusCode() {
      return statusCode;
    },
    getResponseData() {
      return responseData;
    },
  };

  return { req, res };
}

async function runTests() {
  console.log('🧪 Starting Doctor Current Patient Reports Module & Authorization Verification...\n');

  try {
    // Setup test doctor
    const doctor = await prisma.doctor.findFirst({
      where: { regStatus: 'APPROVED' },
      include: { user: true },
    });

    if (!doctor) {
      throw new Error('No approved doctor found in database');
    }

    // Setup unauthorized doctor
    const unauthorizedDoctor = await prisma.doctor.findFirst({
      where: {
        id: { not: doctor.id },
        regStatus: 'APPROVED',
      },
      include: { user: true },
    });

    // Setup patient with reports
    const patientA = await prisma.patient.findFirst({
      where: { healthId: 'HP-100245' },
      include: { user: true },
    });

    // Setup patient B
    const patientB = await prisma.patient.findFirst({
      where: { healthId: { not: 'HP-100245' } },
      include: { user: true },
    });

    if (!patientA || !patientB) {
      throw new Error('Test patients not found');
    }

    console.log(`✓ Doctor A: ${doctor.fullName} (Doctor ID: ${doctor.id})`);
    if (unauthorizedDoctor) {
      console.log(`✓ Unauthorized Doctor B: ${unauthorizedDoctor.fullName} (Doctor ID: ${unauthorizedDoctor.id})`);
    }
    console.log(`✓ Patient A: ${patientA.fullName} (${patientA.healthId})`);
    console.log(`✓ Patient B: ${patientB.fullName} (${patientB.healthId})`);

    // Ensure Doctor A has active permission for Patient A with reports scope
    await prisma.permission.upsert({
      where: {
        id: 'test-doctor-patient-reports-perm',
      },
      update: {
        patientId: patientA.id,
        doctorId: doctor.id,
        status: 'ACTIVE',
        approvedScope: 'Consultations, Prescriptions, Lab Reports, Reports',
        scopeJson: JSON.stringify(['Consultations', 'Prescriptions', 'Lab Reports', 'Reports']),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        id: 'test-doctor-patient-reports-perm',
        patientId: patientA.id,
        doctorId: doctor.id,
        status: 'ACTIVE',
        approvedScope: 'Consultations, Prescriptions, Lab Reports, Reports',
        scopeJson: JSON.stringify(['Consultations', 'Prescriptions', 'Lab Reports', 'Reports']),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Create a real Lab Report in PostgreSQL for Patient A
    const testReportNumber = `LR-TEST-${Date.now().toString().slice(-4)}`;
    const createdReport = await prisma.labReport.create({
      data: {
        reportNumber: testReportNumber,
        patientId: patientA.id,
        doctorId: doctor.id,
        testName: 'Complete Metabolic & Lipid Panel',
        category: 'Biochemistry',
        sampleDate: new Date().toISOString().split('T')[0],
        resultDate: new Date().toISOString().split('T')[0],
        laboratoryName: 'Apex Diagnostic Services',
        summary: 'Optimal cardiovascular lipid levels. Total Cholesterol 185 mg/dL, HDL 48 mg/dL.',
        findingsJson: JSON.stringify({
          cholesterol: '185 mg/dL',
          hdl: '48 mg/dL',
          ldl: '110 mg/dL',
          triglycerides: '135 mg/dL',
        }),
        status: 'COMPLETED',
        canonicalDataJson: JSON.stringify({ test: 'Lipid Panel', patient: patientA.healthId }),
        recordHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockchainTxId: '0xtx-reports-proof-789',
        blockchainStatus: 'VERIFIED',
      },
    });

    console.log(`\n--- Test 1: Real Report Created in PostgreSQL ---`);
    console.log(`✅ Created LabReport ID: ${createdReport.id}, Report No: ${createdReport.reportNumber}`);

    const doctorAUser = {
      id: doctor.userId,
      email: doctor.user.email,
      role: 'DOCTOR',
      doctorId: doctor.id,
      fullName: doctor.fullName,
    };

    // Test 2: Doctor A fetches Patient A's authorized EMR
    console.log(`\n--- Test 2: Doctor A fetches Patient A Authorized EMR ---`);
    const { req: emrReq, res: emrRes } = mockReqRes(doctorAUser, {}, { patientId: patientA.healthId });
    await doctorController.getAuthorizedEMR(emrReq, emrRes);

    const emrData = emrRes.getResponseData();
    if (emrRes.getStatusCode() !== 200 || !emrData?.success) {
      throw new Error(`Failed to fetch EMR: ${JSON.stringify(emrData)}`);
    }

    console.log(`✅ Status 200 OK: EMR retrieved successfully`);
    console.log(`   Patient: ${emrData.patient.fullName} (${emrData.patient.healthId})`);
    console.log(`   Lab Reports Count: ${emrData.patient.labReports?.length || 0}`);

    const foundReport = (emrData.patient.labReports || []).find((r: any) => r.reportNumber === testReportNumber);
    if (!foundReport) {
      throw new Error(`Report ${testReportNumber} not found in authorized EMR response!`);
    }

    console.log(`✅ Real PostgreSQL report found in Doctor's EMR view:`);
    console.log(`   - Test Name: "${foundReport.testName}"`);
    console.log(`   - Category: ${foundReport.category}`);
    console.log(`   - Laboratory: ${foundReport.laboratoryName}`);
    console.log(`   - Summary: ${foundReport.summary}`);
    console.log(`   - Blockchain Hash: ${foundReport.recordHash}`);

    // Test 3: Doctor without permission tries to access Patient A's EMR
    if (unauthorizedDoctor) {
      console.log(`\n--- Test 3: Unauthorized Doctor B Access Attempt ---`);
      const doctorBUser = {
        id: unauthorizedDoctor.userId,
        email: unauthorizedDoctor.user.email,
        role: 'DOCTOR',
        doctorId: unauthorizedDoctor.id,
        fullName: unauthorizedDoctor.fullName,
      };

      const { req: unauthReq, res: unauthRes } = mockReqRes(doctorBUser, {}, { patientId: patientA.healthId });
      await doctorController.getAuthorizedEMR(unauthReq, unauthRes);

      console.log(`   Response status: ${unauthRes.getStatusCode()}`);
      if (unauthRes.getStatusCode() === 403) {
        console.log(`✅ PASS: Unauthorized Doctor B access blocked with 403 Forbidden!`);
      } else {
        throw new Error(`Expected 403 Forbidden, received ${unauthRes.getStatusCode()}`);
      }
    }

    // Test 4: Publish new report via Doctor Controller
    console.log(`\n--- Test 4: Publish New Report via Doctor Controller ---`);
    const { req: pubReq, res: pubRes } = mockReqRes(
      doctorAUser,
      {
        patientId: patientA.id,
        testName: 'Thyroid Stimulating Hormone (TSH) Assay',
        category: 'Endocrinology',
        laboratoryName: 'Apex Diagnostic Services, Jubilee Hills',
        sampleDate: new Date().toISOString().split('T')[0],
        resultDate: new Date().toISOString().split('T')[0],
        summary: 'TSH level 2.15 mIU/L (Euthyroid state, within normal clinical limits).',
        findings: {
          tsh: '2.15 mIU/L',
          t3: '1.2 ng/mL',
          t4: '8.4 ug/dL',
        },
      }
    );

    await doctorController.createLabReport(pubReq, pubRes);
    const pubData = pubRes.getResponseData();
    if (pubRes.getStatusCode() !== 201 || !pubData?.success) {
      throw new Error(`Failed to publish report: ${JSON.stringify(pubData)}`);
    }

    console.log(`✅ PASS: Doctor published new report: ID = ${pubData.report.id}, Number = ${pubData.report.reportNumber}`);

    console.log('\n🎉 ALL DOCTOR REPORTS MODULE & AUTHORIZATION TESTS PASSED 100%!\n');
  } catch (err: any) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
