import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller.js';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole, requireVerifiedDoctor } from '../middleware/rbac.middleware.js';

const router = Router();

// Base requirement: DOCTOR role
router.use(authenticateToken, requireRole('DOCTOR'));

// Profile & Dashboard (Allowed even for pending doctors so they can see their verification status)
router.get('/dashboard', (req, res) => doctorController.getDashboard(req, res));
router.get('/profile', (req, res) => doctorController.getProfile(req, res));
router.put('/settings', (req, res) => doctorController.updateSettings(req, res));
router.get('/audit', (req, res) => doctorController.getAuditHistory(req, res));

// Notifications for Doctor
router.get('/notifications', (req, res) => notificationController.getNotifications(req, res));
router.get('/me/notifications', (req, res) => notificationController.getNotifications(req, res));
router.patch('/notifications/:id/read', (req, res) => notificationController.markNotificationRead(req, res));
router.post('/notifications/:id/read', (req, res) => notificationController.markNotificationRead(req, res));
router.delete('/notifications/:id', (req, res) => notificationController.deleteNotification(req, res));

// Sensitive Clinical Operations: Require VERIFIED (APPROVED) Doctor!
router.use(requireVerifiedDoctor);

// Appointments Management
router.get('/appointments', (req, res) => doctorController.getAppointments(req, res));
router.patch('/appointments/:id/status', (req, res) => doctorController.updateAppointmentStatus(req, res));

// Patient Search & Access Requests
router.get('/patients/search', (req, res) => doctorController.searchPatients(req, res));
router.post('/patients/search', (req, res) => doctorController.searchPatients(req, res));
router.post('/access-requests', (req, res) => doctorController.createAccessRequest(req, res));
router.get('/access-requests', (req, res) => doctorController.listAccessRequests(req, res));

// Authorized EMR Access (Scope & Permission Enforced)
router.get('/active-patients', (req, res) => doctorController.getAuthorizedPatients(req, res));
router.get('/authorized-patients', (req, res) => doctorController.getAuthorizedPatients(req, res));
router.get('/patients/:patientId/emr', (req, res) => doctorController.getAuthorizedEMR(req, res));

// Clinical Documentation & Blockchain Registry
router.post('/consultations', (req, res) => doctorController.createConsultation(req, res));
router.put('/consultations/:id', (req, res) => doctorController.updateConsultation(req, res));
router.patch('/consultations/:id', (req, res) => doctorController.updateConsultation(req, res));
router.post('/prescriptions', (req, res) => doctorController.createPrescription(req, res));
router.post('/lab-reports', (req, res) => doctorController.createLabReport(req, res));

// Emergency Access Workflow
router.post('/emergency/initiate', (req, res) => doctorController.initiateEmergencyAccess(req, res));
router.post('/emergency-access', (req, res) => doctorController.initiateEmergencyAccess(req, res));
router.post('/emergency/:sessionId/note', (req, res) => doctorController.addEmergencyTreatmentNote(req, res));
router.post('/emergency/:sessionId/end', (req, res) => doctorController.endEmergencySession(req, res));

export default router;
