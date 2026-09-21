import { prisma } from '../src/models/prisma.js';
import { doctorController } from '../src/controllers/doctor.controller.js';
import { patientController } from '../src/controllers/patient.controller.js';

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

function getPrescriptionIdFromNotification(notif: any): string | null {
  if (!notif) return null;

  let metadata: any = {};
  if (notif.metadataJson) {
    if (typeof notif.metadataJson === 'object') {
      metadata = notif.metadataJson;
    } else {
      try {
        metadata = JSON.parse(notif.metadataJson);
      } catch {}
    }
  }

  if (metadata.prescriptionId && typeof metadata.prescriptionId === 'string' && metadata.prescriptionId.trim()) {
    return metadata.prescriptionId.trim();
  }
  if (metadata.id && typeof metadata.id === 'string' && metadata.id.trim()) {
    return metadata.id.trim();
  }

  const directId = notif.prescriptionId || notif.relatedEntityId || notif.referenceId || notif.resourceId;
  if (directId && typeof directId === 'string' && directId.trim()) {
    return directId.trim();
  }

  const link = notif.linkRoute || notif.link || notif.actionUrl;
  if (link && typeof link === 'string') {
    const match = link.match(/\/patient\/prescriptions\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

async function runPrescriptionVerification() {
  console.log('🩺 Starting End-to-End Prescription Notification & Review Verification...\n');

  // 1. Fetch Doctor, Patient A (Rahul), Patient B (Mohith)
  const doctor = await prisma.doctor.findFirst({
    where: { regStatus: 'APPROVED' },
    include: { user: true },
  });

  const patientA = await prisma.patient.findFirst({
    where: { healthId: 'HP-100245' },
    include: { user: true },
  });

  const patientB = await prisma.patient.findFirst({
    where: { healthId: 'HP-100246' },
    include: { user: true },
  });

  if (!doctor || !patientA || !patientB) {
    throw new Error('Test fixtures missing in database');
  }

  console.log(`✓ Doctor: Dr. ${doctor.fullName} (${doctor.id})`);
  console.log(`✓ Patient A: ${patientA.fullName} (Health ID: ${patientA.healthId}, Patient ID: ${patientA.id})`);
  console.log(`✓ Patient B: ${patientB.fullName} (Health ID: ${patientB.healthId}, Patient ID: ${patientB.id})\n`);

  // Ensure Doctor has active permission for Patient A
  const existingPerm = await prisma.permission.findFirst({
    where: {
      patientId: patientA.id,
      doctorId: doctor.id,
    },
  });

  if (existingPerm) {
    await prisma.permission.update({
      where: { id: existingPerm.id },
      data: {
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } else {
    await prisma.permission.create({
      data: {
        patientId: patientA.id,
        doctorId: doctor.id,
        status: 'ACTIVE',
        scopeJson: JSON.stringify(['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS']),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const doctorUser = {
    id: doctor.userId,
    doctorId: doctor.id,
    role: 'DOCTOR',
    fullName: doctor.fullName,
    doctorRegNumber: doctor.registrationNumber,
  };

  const patientAUser = {
    id: patientA.userId,
    patientId: patientA.id,
    role: 'PATIENT',
    healthId: patientA.healthId,
    fullName: patientA.fullName,
  };

  const patientBUser = {
    id: patientB.userId,
    patientId: patientB.id,
    role: 'PATIENT',
    healthId: patientB.healthId,
    fullName: patientB.fullName,
  };

  // STEP 1: Doctor creates prescription for Patient A
  console.log('--- Step 1: Doctor creates prescription for Patient A ---');
  const createPrescriptionBody = {
    patientId: patientA.id,
    diagnosis: 'Acute Pharyngitis and Cough',
    notes: 'Take medications strictly with food. Hydrate adequately.',
    medicines: [
      {
        medicineName: 'Amoxicillin 500mg',
        dosage: '1 capsule',
        frequency: 'Three times daily',
        timingMorning: true,
        timingAfternoon: true,
        timingNight: true,
        duration: '7 days',
        instructions: 'After meals',
      },
      {
        medicineName: 'Cetirizine 10mg',
        dosage: '1 tablet',
        frequency: 'Once daily at bedtime',
        timingNight: true,
        duration: '5 days',
        instructions: 'At bedtime',
      },
    ],
  };

  const { req: createReq, res: createRes } = mockReqRes(doctorUser, createPrescriptionBody);
  await doctorController.createPrescription(createReq, createRes);

  if (createRes.getStatusCode() !== 201) {
    throw new Error(`Failed to create prescription: ${JSON.stringify(createRes.getResponseData())}`);
  }

  const createdPrescription = createRes.getResponseData().prescription;
  console.log(`✅ Prescription Created: ID = ${createdPrescription.id}, Number = ${createdPrescription.prescriptionNumber}`);

  // STEP 2: Verify Patient A received notification with real prescription ID
  console.log('\n--- Step 2: Verify Patient A receives notification with real prescription ID ---');
  const notification = await prisma.notification.findFirst({
    where: {
      userId: patientA.userId,
      type: 'PRESCRIPTION',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!notification) {
    throw new Error('Notification not found for Patient A');
  }

  console.log(`✅ Notification Found:`);
  console.log(`   - Title: "${notification.title}"`);
  console.log(`   - linkRoute: "${notification.linkRoute}"`);
  console.log(`   - metadataJson: ${notification.metadataJson}`);

  if (notification.linkRoute !== `/patient/prescriptions/${createdPrescription.id}`) {
    throw new Error(`linkRoute mismatch: expected /patient/prescriptions/${createdPrescription.id}, got ${notification.linkRoute}`);
  }

  // STEP 3: Test frontend notification helper extraction
  console.log('\n--- Step 3: Test Review click ID extraction ---');
  const extractedId = getPrescriptionIdFromNotification(notification);
  console.log(`✅ Extracted Prescription ID for Review: "${extractedId}"`);

  if (extractedId !== createdPrescription.id) {
    throw new Error(`Extracted ID mismatch: expected ${createdPrescription.id}, got ${extractedId}`);
  }

  // STEP 4: Patient A requests /api/patients/me/prescriptions/<REAL_ID>
  console.log('\n--- Step 4: Patient A opens /patient/prescriptions/<REAL_ID> ---');
  const { req: getReq, res: getRes } = mockReqRes(patientAUser, {}, { id: createdPrescription.id });
  await patientController.getPrescriptionById(getReq, getRes);

  if (getRes.getStatusCode() !== 200) {
    throw new Error(`Patient A failed to get prescription: status ${getRes.getStatusCode()}`);
  }

  const fetchedPrescription = getRes.getResponseData().prescription;
  console.log(`✅ Prescription successfully fetched:`);
  console.log(`   - Number: ${fetchedPrescription.prescriptionNumber}`);
  console.log(`   - Diagnosis: ${fetchedPrescription.diagnosis}`);
  console.log(`   - Medicines count: ${fetchedPrescription.medicines.length}`);
  console.log(`   - Doctor: Dr. ${fetchedPrescription.doctor?.fullName}`);
  console.log(`   - Blockchain Hash: ${fetchedPrescription.recordHash}`);

  // STEP 5: Verify Patient B (Mohith) CANNOT access Patient A's prescription
  console.log('\n--- Step 5: Verify Patient B cannot access Patient A prescription (Ownership Check) ---');
  const { req: getBReq, res: getBRes } = mockReqRes(patientBUser, {}, { id: createdPrescription.id });
  await patientController.getPrescriptionById(getBReq, getBRes);

  console.log(`   - Patient B request response code: ${getBRes.getStatusCode()}`);
  console.log(`   - Response error: ${JSON.stringify(getBRes.getResponseData())}`);

  if (getBRes.getStatusCode() === 404 && getBRes.getResponseData().error === 'Prescription not found') {
    console.log('✅ PASS: Patient B received 404 Not Found (Cross-patient access blocked strictly!)');
  } else {
    throw new Error(`Security violation: Patient B got code ${getBRes.getStatusCode()}`);
  }

  // STEP 6: Verify non-existent ID returns 404 cleanly
  console.log('\n--- Step 6: Verify non-existent / invalid ID returns clean 404 ---');
  const { req: invalidReq, res: invalidRes } = mockReqRes(patientAUser, {}, { id: '00000000-0000-0000-0000-000000000000' });
  await patientController.getPrescriptionById(invalidReq, invalidRes);

  if (invalidRes.getStatusCode() === 404) {
    console.log('✅ PASS: Invalid ID returned 404 Not Found cleanly without server error.');
  } else {
    throw new Error(`Unexpected status for invalid ID: ${invalidRes.getStatusCode()}`);
  }

  // STEP 7: Verify Patient A fetching all prescriptions
  console.log('\n--- Step 7: Verify Patient A view all prescriptions ---');
  const { req: listReq, res: listRes } = mockReqRes(patientAUser, {}, {});
  await patientController.getPrescriptions(listReq, listRes);

  if (listRes.getStatusCode() === 200 && Array.isArray(listRes.getResponseData().prescriptions)) {
    console.log(`✅ PASS: Patient A retrieved ${listRes.getResponseData().prescriptions.length} total prescription(s).`);
  } else {
    throw new Error(`Failed to list prescriptions: ${listRes.getStatusCode()}`);
  }

  console.log('\n🎉 ALL PRESCRIPTION NOTIFICATION REVIEW FLOW TESTS PASSED 100%!\n');
}

runPrescriptionVerification()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
