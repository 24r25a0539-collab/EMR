import { Router } from 'express';
import { patientController } from '../controllers/patient.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

// All routes require PATIENT role
router.use(authenticateToken, requireRole('PATIENT'));

// Profile
router.get('/me', (req, res) => patientController.getProfile(req, res));
router.put('/me', (req, res) => patientController.updateProfile(req, res));

// Medical Records & History
router.get('/me/records', (req, res) => patientController.getRecords(req, res));
router.get('/me/consultations', (req, res) => patientController.getConsultations(req, res));
router.get('/me/consultations/:id', (req, res) => patientController.getConsultationById(req, res));
router.get('/me/prescriptions', (req, res) => patientController.getPrescriptions(req, res));
router.get('/me/prescriptions/:id', (req, res) => patientController.getPrescriptionById(req, res));
router.get('/me/labs', (req, res) => patientController.getLabReports(req, res));
router.get('/me/labs/:id', (req, res) => patientController.getLabReportById(req, res));
router.post('/me/labs', (req, res) => patientController.uploadLabReport(req, res));
router.get('/me/lab-reports', (req, res) => patientController.getLabReports(req, res));
router.get('/me/lab-reports/:id', (req, res) => patientController.getLabReportById(req, res));
router.post('/me/lab-reports', (req, res) => patientController.uploadLabReport(req, res));
router.get('/me/medicines', (req, res) => patientController.getMedicines(req, res));
router.post('/me/medicines', (req, res) => patientController.addMedicine(req, res));
router.patch('/me/medicines/:id/action', (req, res) => patientController.updateMedicineAction(req, res));
router.post('/me/allergies', (req, res) => patientController.addAllergy(req, res));
router.delete('/me/allergies/:id', (req, res) => patientController.deleteAllergy(req, res));

// Appointments
router.get('/me/appointments', (req, res) => patientController.getAppointments(req, res));
router.post('/me/appointments', (req, res) => patientController.bookAppointment(req, res));
router.patch('/me/appointments/:id/cancel', (req, res) => patientController.cancelAppointment(req, res));

// Access Permissions
router.get('/me/access-permissions', (req, res) => patientController.getAccessPermissions(req, res));
router.get('/access-permissions', (req, res) => patientController.getAccessPermissions(req, res));
router.get('/access-requests', (req, res) => patientController.getAccessPermissions(req, res));
router.post('/me/access-requests/:id/approve', (req, res) => patientController.approveAccessRequest(req, res));
router.post('/access-requests/:id/approve', (req, res) => patientController.approveAccessRequest(req, res));
router.post('/me/access-requests/:id/reject', (req, res) => patientController.rejectAccessRequest(req, res));
router.post('/access-requests/:id/reject', (req, res) => patientController.rejectAccessRequest(req, res));
router.post('/me/permissions/:id/revoke', (req, res) => patientController.revokePermission(req, res));
router.post('/permissions/:id/revoke', (req, res) => patientController.revokePermission(req, res));


// Emergency & Contacts
router.post('/me/emergency-contacts', (req, res) => patientController.manageEmergencyContacts(req, res));

// Audit & Corrections
router.get('/me/audit', (req, res) => patientController.getAuditHistory(req, res));
router.post('/me/correction-requests', (req, res) => patientController.requestCorrection(req, res));

// Notifications
router.get('/me/notifications', (req, res) => patientController.getNotifications(req, res));
router.patch('/me/notifications/:id/read', (req, res) => patientController.markNotificationRead(req, res));
router.post('/me/notifications/:id/read', (req, res) => patientController.markNotificationRead(req, res));

// Documents & Document Privacy
router.get('/me/documents', (req, res) => patientController.getDocuments(req, res));
router.get('/me/documents/:id', (req, res) => patientController.getDocumentById(req, res));
router.patch('/me/documents/:id/privacy', (req, res) => patientController.updateDocumentPrivacy(req, res));
router.put('/me/documents/:id/privacy', (req, res) => patientController.updateDocumentPrivacy(req, res));
router.get('/documents', (req, res) => patientController.getDocuments(req, res));
router.get('/documents/:id', (req, res) => patientController.getDocumentById(req, res));
router.patch('/documents/:id/privacy', (req, res) => patientController.updateDocumentPrivacy(req, res));
router.put('/documents/:id/privacy', (req, res) => patientController.updateDocumentPrivacy(req, res));

// Helpdesk / Support
router.get('/me/helpdesk', (req, res) => patientController.getHelpdeskTickets(req, res));
router.post('/me/helpdesk', (req, res) => patientController.createHelpdeskTicket(req, res));

export default router;
