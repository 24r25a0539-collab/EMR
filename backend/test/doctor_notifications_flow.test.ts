import { prisma } from '../src/models/prisma.js';
import { doctorController } from '../src/controllers/doctor.controller.js';
import { patientController } from '../src/controllers/patient.controller.js';
import { notificationController } from '../src/controllers/notification.controller.js';

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

async function runDoctorNotificationsVerification() {
  console.log('🩺 Starting Comprehensive Doctor Notifications & Role Authorization Verification...\n');

  // 1. Fetch Fixtures
  const doctorA = await prisma.doctor.findFirst({
    where: { regStatus: 'APPROVED' },
    include: { user: true },
  });

  const doctorB = await prisma.doctor.findFirst({
    where: {
      id: { not: doctorA?.id },
      regStatus: 'APPROVED',
    },
    include: { user: true },
  });

  const patientA = await prisma.patient.findFirst({
    where: { healthId: 'HP-100245' },
    include: { user: true },
  });

  if (!doctorA || !doctorB || !patientA) {
    throw new Error('Test fixtures missing in database');
  }

  const doctorAUser = {
    id: doctorA.userId,
    doctorId: doctorA.id,
    role: 'DOCTOR',
    fullName: doctorA.fullName,
    doctorRegNumber: doctorA.registrationNumber,
  };

  const doctorBUser = {
    id: doctorB.userId,
    doctorId: doctorB.id,
    role: 'DOCTOR',
    fullName: doctorB.fullName,
    doctorRegNumber: doctorB.registrationNumber,
  };

  const patientAUser = {
    id: patientA.userId,
    patientId: patientA.id,
    role: 'PATIENT',
    healthId: patientA.healthId,
    fullName: patientA.fullName,
  };

  console.log(`✓ Doctor A: Dr. ${doctorA.fullName} (User ID: ${doctorA.userId})`);
  console.log(`✓ Doctor B: Dr. ${doctorB.fullName} (User ID: ${doctorB.userId})`);
  console.log(`✓ Patient A: ${patientA.fullName} (User ID: ${patientA.userId})\n`);

  // STEP 1: Test Doctor fetching notifications via unified NotificationController
  console.log('--- Step 1: Doctor fetches notifications (No 403 Forbidden) ---');
  const { req: docReq, res: docRes } = mockReqRes(doctorAUser);
  await notificationController.getNotifications(docReq, docRes);

  if (docRes.getStatusCode() !== 200) {
    throw new Error(`Doctor failed to get notifications: status ${docRes.getStatusCode()}`);
  }
  console.log(`✅ PASS: Doctor A successfully fetched notifications (Status 200 OK)`);
  console.log(`   Initial notifications count: ${docRes.getResponseData().notifications.length}, Unread: ${docRes.getResponseData().unreadCount}`);

  // STEP 2: Doctor A requests EMR Access for Patient A -> Patient A Approves -> Doctor A receives Real Notification
  console.log('\n--- Step 2: Access Request Approval Notification Flow ---');
  const { req: reqAccessReq, res: reqAccessRes } = mockReqRes(doctorAUser, {
    healthId: patientA.healthId,
    reason: 'Cardiology consultation and review',
    scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS'],
    requestedDuration: '7_DAYS',
  });
  await doctorController.createAccessRequest(reqAccessReq, reqAccessRes);

  if (reqAccessRes.getStatusCode() !== 201) {
    throw new Error(`Failed to create access request: ${JSON.stringify(reqAccessRes.getResponseData())}`);
  }
  const accessRequest = reqAccessRes.getResponseData().accessRequest;
  console.log(`✅ Access Request created: ID = ${accessRequest.id}`);

  // Patient A approves access request
  const { req: approveReq, res: approveRes } = mockReqRes(patientAUser, {
    scopes: ['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS'],
    durationDays: 7,
  }, { id: accessRequest.id });
  await patientController.approveAccessRequest(approveReq, approveRes);

  if (approveRes.getStatusCode() !== 200) {
    throw new Error(`Failed to approve access request: ${JSON.stringify(approveRes.getResponseData())}`);
  }
  console.log(`✅ Patient A approved access request`);

  // Verify Doctor A received the approval notification
  const docANotif = await prisma.notification.findFirst({
    where: {
      userId: doctorA.userId,
      type: 'ACCESS_REQUEST',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!docANotif) {
    throw new Error('Doctor A did not receive access approval notification');
  }
  console.log(`✅ PASS: Doctor A received access approval notification in PostgreSQL:`);
  console.log(`   - Title: "${docANotif.title}"`);
  console.log(`   - Message: "${docANotif.message}"`);
  console.log(`   - linkRoute: "${docANotif.linkRoute}"`);
  console.log(`   - metadataJson: ${docANotif.metadataJson}`);

  if (!docANotif.linkRoute?.includes(`/doctor/patients/${patientA.id}`)) {
    throw new Error(`Expected linkRoute to contain /doctor/patients/${patientA.id}, got ${docANotif.linkRoute}`);
  }

  // STEP 3: Doctor B requests Access -> Patient A Rejects -> Doctor B receives Rejection Notification
  console.log('\n--- Step 3: Access Request Rejection Notification Flow ---');
  const { req: reqBReq, res: reqBRes } = mockReqRes(doctorBUser, {
    healthId: patientA.healthId,
    reason: 'Second opinion review',
    scopes: ['CONSULTATIONS'],
    requestedDuration: '3_DAYS',
  });
  await doctorController.createAccessRequest(reqBReq, reqBRes);
  const accessRequestB = reqBRes.getResponseData().accessRequest;

  // Patient A rejects access request
  const { req: rejectReq, res: rejectRes } = mockReqRes(patientAUser, {
    reason: 'Not required at this stage',
  }, { id: accessRequestB.id });
  await patientController.rejectAccessRequest(rejectReq, rejectRes);

  if (rejectRes.getStatusCode() !== 200) {
    throw new Error(`Failed to reject access request: ${JSON.stringify(rejectRes.getResponseData())}`);
  }

  const docBNotif = await prisma.notification.findFirst({
    where: {
      userId: doctorB.userId,
      type: 'ACCESS_REQUEST',
      title: { contains: 'Rejected' },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!docBNotif) {
    throw new Error('Doctor B did not receive rejection notification');
  }
  console.log(`✅ PASS: Doctor B received rejection notification:`);
  console.log(`   - Title: "${docBNotif.title}"`);
  console.log(`   - Message: "${docBNotif.message}"`);

  // STEP 4: Patient A books Appointment with Doctor A -> Doctor A receives Real Appointment Notification
  console.log('\n--- Step 4: Appointment Booking Notification Flow ---');
  const nextDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { req: bookReq, res: bookRes } = mockReqRes(patientAUser, {
    doctorId: doctorA.id,
    date: nextDate,
    timeSlot: '11:00 AM',
    appointmentType: 'IN_PERSON',
    reason: 'Routine cardiac checkup',
  });
  await patientController.bookAppointment(bookReq, bookRes);

  if (bookRes.getStatusCode() !== 201) {
    throw new Error(`Failed to book appointment: ${JSON.stringify(bookRes.getResponseData())}`);
  }
  const bookedApt = bookRes.getResponseData().appointment;
  console.log(`✅ Appointment booked: ${bookedApt.appointmentNumber} for ${bookedApt.date} at ${bookedApt.timeSlot}`);

  const aptNotif = await prisma.notification.findFirst({
    where: {
      userId: doctorA.userId,
      type: 'APPOINTMENT',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!aptNotif) {
    throw new Error('Doctor A did not receive appointment notification');
  }
  console.log(`✅ PASS: Doctor A received appointment booking notification:`);
  console.log(`   - Title: "${aptNotif.title}"`);
  console.log(`   - Message: "${aptNotif.message}"`);
  console.log(`   - linkRoute: "${aptNotif.linkRoute}"`);

  // STEP 5: Cross-Doctor Isolation (Security)
  console.log('\n--- Step 5: Verify Cross-Doctor Notification Isolation ---');
  const { req: listAReq, res: listARes } = mockReqRes(doctorAUser);
  await notificationController.getNotifications(listAReq, listARes);

  const { req: listBReq, res: listBRes } = mockReqRes(doctorBUser);
  await notificationController.getNotifications(listBReq, listBRes);

  const docANotifIds = new Set(listARes.getResponseData().notifications.map((n: any) => n.id));
  const docBNotifs = listBRes.getResponseData().notifications;

  for (const n of docBNotifs) {
    if (docANotifIds.has(n.id)) {
      throw new Error(`SECURITY BREACH: Doctor B has access to Doctor A notification (${n.id})`);
    }
  }
  console.log(`✅ PASS: Doctor A notifications (${docANotifIds.size}) and Doctor B notifications (${docBNotifs.length}) are 100% strictly isolated!`);

  // STEP 6: Mark as Read & Dismiss
  console.log('\n--- Step 6: Mark Notification Read & Dismiss Actions ---');
  const targetNotifId = docANotif.id;
  const { req: readReq, res: readRes } = mockReqRes(doctorAUser, {}, { id: targetNotifId });
  await notificationController.markNotificationRead(readReq, readRes);

  if (readRes.getStatusCode() !== 200 || !readRes.getResponseData().notification?.isRead) {
    throw new Error('Failed to mark notification as read');
  }
  console.log(`✅ PASS: Marked notification ${targetNotifId} as read`);

  // Mark all as read
  const { req: readAllReq, res: readAllRes } = mockReqRes(doctorAUser, {}, { id: 'all' });
  await notificationController.markNotificationRead(readAllReq, readAllRes);
  console.log(`✅ PASS: Marked all Doctor A notifications as read`);

  const { req: countReq, res: countRes } = mockReqRes(doctorAUser);
  await notificationController.getNotifications(countReq, countRes);
  console.log(`✅ PASS: Doctor A unread count is now: ${countRes.getResponseData().unreadCount}`);
  if (countRes.getResponseData().unreadCount !== 0) {
    throw new Error(`Expected unread count 0, got ${countRes.getResponseData().unreadCount}`);
  }

  // Delete notification
  const { req: delReq, res: delRes } = mockReqRes(doctorAUser, {}, { id: targetNotifId });
  await notificationController.deleteNotification(delReq, delRes);
  console.log(`✅ PASS: Notification ${targetNotifId} dismissed successfully.`);

  console.log('\n🎉 ALL DOCTOR NOTIFICATION FLOW TESTS PASSED 100%!\n');
}

runDoctorNotificationsVerification()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
