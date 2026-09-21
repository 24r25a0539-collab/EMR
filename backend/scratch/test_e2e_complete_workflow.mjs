import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-emr-platform-jwt-secret-key-change-in-production-2026';

async function main() {
  console.log('=== STARTING END-TO-END EMR WORKFLOW VERIFICATION ===\n');

  // Find an approved doctor with user
  const doctorUser = await prisma.user.findFirst({
    where: { role: 'DOCTOR', doctor: { regStatus: 'APPROVED' } },
    include: { doctor: { include: { affiliations: { include: { hospital: true } } } } }
  });

  const patientUsers = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    include: { patient: true },
    take: 2
  });

  if (!doctorUser || !doctorUser.doctor || patientUsers.length < 2) {
    console.error('Missing approved doctor or patient data for test');
    process.exit(1);
  }

  const doctor = doctorUser.doctor;
  const patientAUser = patientUsers[0];
  const patientAPatient = patientUsers[0].patient;
  const patientBUser = patientUsers[1];
  const patientBPatient = patientUsers[1].patient;

  console.log(`Doctor: Dr. ${doctor.fullName} (${doctor.id})`);
  console.log(`Patient A: ${patientAPatient.fullName} (${patientAPatient.healthId})`);
  console.log(`Patient B: ${patientBPatient.fullName} (${patientBPatient.healthId})\n`);

  // Generate tokens
  const docToken = jwt.sign({ id: doctorUser.id, role: doctorUser.role }, JWT_SECRET, { expiresIn: '7d' });
  const patToken = jwt.sign({ id: patientAUser.id, role: patientAUser.role }, JWT_SECRET, { expiresIn: '7d' });

  // Clean up any old requests/permissions between Doctor & Patient A for a clean test
  await prisma.permission.deleteMany({ where: { patientId: patientAPatient.id, doctorId: doctor.id } });
  await prisma.accessRequest.deleteMany({ where: { patientId: patientAPatient.id, doctorId: doctor.id } });
  await prisma.permission.deleteMany({ where: { patientId: patientBPatient.id, doctorId: doctor.id } });
  await prisma.accessRequest.deleteMany({ where: { patientId: patientBPatient.id, doctorId: doctor.id } });

  await prisma.accessRequest.deleteMany({ where: { patientId: patientAPatient.id, doctorId: doctor.id } });
  await prisma.permission.deleteMany({ where: { patientId: patientBPatient.id, doctorId: doctor.id } });
  await prisma.accessRequest.deleteMany({ where: { patientId: patientBPatient.id, doctorId: doctor.id } });

  console.log('--- TEST A: REQUEST ACCESS ---');
  const reqRes = await fetch(`${API_URL}/doctors/access-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${docToken}`
    },
    body: JSON.stringify({
      patientId: patientAPatient.id,
      scope: 'FULL_EMR',
      reason: 'Specialist clinical assessment and treatment planning',
      durationHours: 72
    })
  });
  const reqData = await reqRes.json();
  console.log('Doctor Request Access status:', reqRes.status, reqData.success);
  if (!reqData.success) throw new Error(`Request access failed: ${JSON.stringify(reqData)}`);

  const createdRequestId = reqData.accessRequest?.id || reqData.request?.id || reqData.data?.id;
  const dbReq = await prisma.accessRequest.findUnique({ where: { id: createdRequestId } });

  console.log(`DB AccessRequest status: ${dbReq.status} (Expected: PENDING)`);
  if (dbReq.status !== 'PENDING') throw new Error('Expected status PENDING');

  const patNotifs = await prisma.notification.findMany({
    where: { userId: patientAUser.id, type: 'ACCESS_REQUEST', isRead: false },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log(`Patient notification created: ${patNotifs[0]?.title} - ${patNotifs[0]?.message}`);
  if (!patNotifs.length) throw new Error('Patient notification not found');

  console.log('\n--- TEST B: PATIENT REVIEW & STATS ---');
  const statsResBefore = await fetch(`${API_URL}/patient/me/access-permissions`, {
    headers: { 'Authorization': `Bearer ${patToken}` }
  });
  const statsBefore = await statsResBefore.json();
  const pendingBefore = statsBefore.requests.filter(r => r.status === 'PENDING').length;
  const approvedBefore = statsBefore.requests.filter(r => r.status === 'APPROVED').length;
  console.log(`Patient access counts before approval: pending=${pendingBefore}, approved=${approvedBefore}`);
  if (pendingBefore < 1) {
    throw new Error(`Expected at least 1 pending request, got ${pendingBefore}`);
  }

  console.log('\n--- TEST C: APPROVE ACCESS ---');
  const approveRes = await fetch(`${API_URL}/patient/me/access-requests/${createdRequestId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patToken}`
    },
    body: JSON.stringify({
      scopes: ['Medical History', 'Conditions', 'Allergies', 'Medicines', 'Prescriptions', 'Consultations', 'Lab Reports'],
      durationDays: 3
    })
  });
  const approveData = await approveRes.json();
  console.log('Approve response:', approveRes.status, approveData.success);
  if (!approveData.success) throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);

  const dbReqAfter = await prisma.accessRequest.findUnique({ where: { id: createdRequestId } });
  console.log(`DB AccessRequest status after approval: ${dbReqAfter.status} (Expected: APPROVED)`);
  if (dbReqAfter.status !== 'APPROVED') throw new Error('Expected AccessRequest status APPROVED');

  const dbPerm = await prisma.permission.findFirst({
    where: { patientId: patientAPatient.id, doctorId: doctor.id, status: 'ACTIVE' }
  });
  console.log(`DB Permission created: ID ${dbPerm?.id}, status: ${dbPerm?.status}, expiresAt: ${dbPerm?.expiresAt}`);
  if (!dbPerm || dbPerm.status !== 'ACTIVE') throw new Error('Expected active permission');

  const statsResAfter = await fetch(`${API_URL}/patient/me/access-permissions`, {
    headers: { 'Authorization': `Bearer ${patToken}` }
  });
  const statsAfter = await statsResAfter.json();
  const pendingAfter = statsAfter.requests.filter(r => r.status === 'PENDING').length;
  const approvedAfter = statsAfter.requests.filter(r => r.status === 'APPROVED').length;
  console.log(`Patient access counts after approval: pending=${pendingAfter}, approved=${approvedAfter}`);

  const docNotifs = await prisma.notification.findMany({
    where: { userId: doctorUser.id, type: 'ACCESS_REQUEST_APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log(`Doctor received approval notification: ${docNotifs[0]?.title} - ${docNotifs[0]?.message}`);
  if (!docNotifs.length) throw new Error('Doctor approval notification missing');

  console.log('\n--- TEST D: DOCTOR PATIENT SEARCH & AUTHORIZED EMR ---');
  const searchRes = await fetch(`${API_URL}/doctors/patients/search?query=${patientAPatient.healthId}`, {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  const searchData = await searchRes.json();
  const foundPatient = searchData.patients?.[0];
  console.log(`Doctor searched patient: ${foundPatient?.fullName}, accessStatus: ${foundPatient?.accessStatus}`);
  if (foundPatient?.accessStatus !== 'AUTHORIZED') {
    throw new Error(`Expected accessStatus AUTHORIZED, got ${foundPatient?.accessStatus}`);
  }

  const emrRes = await fetch(`${API_URL}/doctors/patients/${patientAPatient.healthId}/emr`, {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  const emrData = await emrRes.json();
  console.log('Doctor open authorized EMR:', emrRes.status, emrData.success, 'patient:', emrData.patient?.fullName);
  if (!emrData.success || !emrData.patient) throw new Error('Authorized EMR access failed');

  console.log('\n--- TEST E: NEW CONSULTATION + PRESCRIPTION + MEDICINE + LAB ORDER ---');
  const consultRes = await fetch(`${API_URL}/doctors/consultations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${docToken}`
    },
    body: JSON.stringify({
      patientId: patientAPatient.id,
      patientHealthId: patientAPatient.healthId,
      diagnosis: 'Acute Upper Respiratory Tract Infection',
      symptoms: 'Fever 101.5F, productive cough, sore throat for 3 days',
      clinicalNotes: 'Throat congestion with erythematous pharynx. Chest clear to auscultation bilaterally.',
      treatmentPlan: 'Antibiotic therapy with symptomatic hydration and steam inhalation.',
      followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      medicines: [
        {
          name: 'Amoxicillin & Clavulanate 625mg',
          dosage: '625mg',
          frequency: 'Twice daily',
          duration: '5 days',
          timingMorning: true,
          timingNight: true,
          instructions: 'Take after meals'
        },
        {
          name: 'Paracetamol 650mg',
          dosage: '650mg',
          frequency: 'Thrice daily as needed',
          duration: '3 days',
          timingMorning: true,
          timingAfternoon: true,
          timingNight: true,
          instructions: 'Take for fever above 100F'
        }
      ],
      recommendedLabTests: 'Complete Blood Count (CBC) & C-Reactive Protein (CRP)'
    })
  });
  const consultData = await consultRes.json();
  console.log('Save Consultation status:', consultRes.status, consultData.success);
  if (!consultData.success || !consultData.consultation) throw new Error(`Save consultation failed: ${JSON.stringify(consultData)}`);

  const createdConsultationId = consultData.consultation.id;
  console.log(`Created Consultation ID: ${createdConsultationId}, Number: ${consultData.consultation.consultationNumber}`);

  console.log('\n--- TEST F: PATIENT SYNC & RECORDS VERIFICATION ---');
  const dbConsult = await prisma.consultation.findUnique({
    where: { id: createdConsultationId },
    include: { prescriptions: { include: { medicines: true } } }
  });
  console.log(`DB Consultation verified: ${dbConsult.diagnosis}, linked Prescriptions: ${dbConsult.prescriptions.length}`);
  if (!dbConsult || dbConsult.prescriptions.length === 0) throw new Error('Consultation or linked Prescription missing in DB');

  const dbMeds = await prisma.medication.findMany({
    where: { patientId: patientAPatient.id, medicineName: { contains: 'Amoxicillin' } }
  });

  console.log(`DB Medications synchronized: found ${dbMeds.length} items`);
  if (!dbMeds.length) throw new Error('Medication synchronization to patient failed');

  const dbLabs = await prisma.labReport.findMany({
    where: { patientId: patientAPatient.id, testName: { contains: 'Complete Blood Count' } }
  });
  console.log(`DB Lab Reports synchronized: found ${dbLabs.length} records`);
  if (!dbLabs.length) throw new Error('Lab report order synchronization failed');

  const patConsultNotifs = await prisma.notification.findMany({
    where: { userId: patientAUser.id, type: 'CONSULTATION' },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log(`Patient consultation notification: ${patConsultNotifs[0]?.title} - ${patConsultNotifs[0]?.message}`);
  if (!patConsultNotifs.length) throw new Error('Patient consultation notification missing');

  console.log('\n--- TEST G: AUDIT LOG VERIFICATION ---');
  const auditLogs = await prisma.auditEvent.findMany({
    where: { patientId: patientAPatient.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(`Audit events found for patient: ${auditLogs.map(a => a.action).join(', ')}`);
  if (!auditLogs.some(a => a.action === 'CREATE' || a.action === 'DOCTOR_ACCESS_APPROVED')) {
    throw new Error('Audit trail missing consultation or approval actions');
  }

  console.log('\n--- TEST H: EDIT CONSULTATION DURING ACTIVE ACCESS ---');
  const editRes = await fetch(`${API_URL}/doctors/consultations/${createdConsultationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${docToken}`
    },
    body: JSON.stringify({
      diagnosis: 'Acute Bacterial Pharyngotonsillitis',
      treatmentPlan: 'Antibiotic therapy with warm saline gargles and follow-up in 5 days.',
      clinicalNotes: 'Throat examination confirms marked tonsillar exudate. Patient feeling slightly better.'
    })
  });
  const editData = await editRes.json();
  console.log('Edit Consultation status:', editRes.status, editData.success);
  if (!editData.success) throw new Error(`Edit consultation failed: ${JSON.stringify(editData)}`);

  const updatedConsult = await prisma.consultation.findUnique({ where: { id: createdConsultationId } });
  console.log(`Updated diagnosis: ${updatedConsult.diagnosis}`);
  if (updatedConsult.diagnosis !== 'Acute Bacterial Pharyngotonsillitis') {
    throw new Error('Consultation diagnosis update failed to persist');
  }

  console.log('\n--- TEST I: PATIENT REVOKES ACCESS -> 403 ENFORCEMENT ---');
  const revokeRes = await fetch(`${API_URL}/patient/me/permissions/${dbPerm.id}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patToken}`
    },
    body: JSON.stringify({ reason: 'Consultation and course completed' })
  });
  const revokeData = await revokeRes.json();
  console.log('Revoke permission status:', revokeRes.status, revokeData.success);
  if (!revokeData.success) throw new Error(`Revoke failed: ${JSON.stringify(revokeData)}`);

  const dbPermRevoked = await prisma.permission.findUnique({ where: { id: dbPerm.id } });
  console.log(`DB Permission after revoke: ${dbPermRevoked.status} (Expected: REVOKED)`);
  if (dbPermRevoked.status !== 'REVOKED') throw new Error('Expected Permission status REVOKED');

  // Doctor tries to access EMR -> Expect 403
  const emrBlockedRes = await fetch(`${API_URL}/doctors/patients/${patientAPatient.healthId}/emr`, {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  console.log(`Doctor access EMR after revoke HTTP status: ${emrBlockedRes.status} (Expected: 403)`);
  if (emrBlockedRes.status !== 403) throw new Error(`Expected 403, got ${emrBlockedRes.status}`);

  // Doctor tries to edit consultation after revoke -> Expect 403
  const editBlockedRes = await fetch(`${API_URL}/doctors/consultations/${createdConsultationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${docToken}`
    },
    body: JSON.stringify({ diagnosis: 'Illegal edit attempt after revocation' })
  });
  console.log(`Doctor edit consultation after revoke HTTP status: ${editBlockedRes.status} (Expected: 403)`);
  if (editBlockedRes.status !== 403) throw new Error(`Expected 403, got ${editBlockedRes.status}`);

  console.log('\n--- TEST J: PERMISSION EXPIRY ENFORCEMENT ---');
  // Create a temporary expired permission
  const expiredPerm = await prisma.permission.create({
    data: {
      patientId: patientAPatient.id,
      doctorId: doctor.id,
      scope: 'FULL_EMR',
      scopeJson: JSON.stringify(['FULL_EMR']),
      status: 'EXPIRED',
      grantedAt: new Date(Date.now() - 48 * 3600000),
      expiresAt: new Date(Date.now() - 1000)
    }
  });


  const emrExpiredRes = await fetch(`${API_URL}/doctors/patients/${patientAPatient.healthId}/emr`, {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  console.log(`Doctor access with expired permission HTTP status: ${emrExpiredRes.status} (Expected: 403)`);
  if (emrExpiredRes.status !== 403) throw new Error(`Expected 403, got ${emrExpiredRes.status}`);
  await prisma.permission.delete({ where: { id: expiredPerm.id } });

  console.log('\n--- TEST K: REJECTION FLOW ---');
  // Doctor requests access again
  const reqRes2 = await fetch(`${API_URL}/doctors/access-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${docToken}`
    },
    body: JSON.stringify({
      patientId: patientAPatient.id,
      scope: 'CONSULTATIONS',
      reason: 'Routine follow-up inquiry',
      durationHours: 24
    })
  });
  const reqData2 = await reqRes2.json();
  const reqId2 = reqData2.accessRequest?.id || reqData2.request?.id || reqData2.data?.id;


  // Patient rejects
  const rejectRes = await fetch(`${API_URL}/patient/me/access-requests/${reqId2}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patToken}`
    },
    body: JSON.stringify({ reason: 'Not seeking consultation at this time' })
  });
  const rejectData = await rejectRes.json();
  console.log('Reject access request status:', rejectRes.status, rejectData.success);
  if (!rejectData.success) throw new Error(`Reject failed: ${JSON.stringify(rejectData)}`);

  const dbReqRejected = await prisma.accessRequest.findUnique({ where: { id: reqId2 } });
  console.log(`DB AccessRequest after rejection: ${dbReqRejected.status} (Expected: REJECTED)`);
  if (dbReqRejected.status !== 'REJECTED') throw new Error('Expected status REJECTED');

  const docRejectNotif = await prisma.notification.findFirst({
    where: { userId: doctorUser.id, type: 'ACCESS_REQUEST_REJECTED' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`Doctor received rejection notification: ${docRejectNotif?.title} - ${docRejectNotif?.message}`);
  if (!docRejectNotif) throw new Error('Doctor rejection notification missing');

  console.log('\n--- TEST M: CROSS-PATIENT ACCESS SECURITY ---');
  // Doctor has no permission for Patient B -> Expect 403
  const crossEmrRes = await fetch(`${API_URL}/doctors/patients/${patientBPatient.healthId}/emr`, {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  console.log(`Doctor access Patient B without consent HTTP status: ${crossEmrRes.status} (Expected: 403)`);
  if (crossEmrRes.status !== 403) throw new Error(`Expected 403, got ${crossEmrRes.status}`);

  console.log('\n======================================================');
  console.log('✓ ALL 11 END-TO-END WORKFLOW TESTS PASSED PERFECTLY!');
  console.log('======================================================');

}

main()
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
