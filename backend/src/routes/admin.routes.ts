import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

// Base requirement: ADMIN role
router.use(authenticateToken, requireRole('ADMIN'));

// Dashboard KPIs
router.get('/dashboard', (req, res) => adminController.getDashboard(req, res));

// Doctor Verification
router.get('/doctors', (req, res) => adminController.getDoctors(req, res));
router.post('/doctors/:id/verify', (req, res) => adminController.verifyDoctor(req, res));

// Hospital Management
router.get('/hospitals', (req, res) => adminController.getHospitals(req, res));
router.post('/hospitals', (req, res) => adminController.createHospital(req, res));
router.patch('/hospitals/:id/status', (req, res) => adminController.updateHospitalStatus(req, res));

// User Management
router.get('/users', (req, res) => adminController.getUsers(req, res));
router.patch('/users/:id/status', (req, res) => adminController.updateUserStatus(req, res));

// Audit Center (Read-only)
router.get('/audit', (req, res) => adminController.getAuditLogs(req, res));

// Security Center
router.get('/security', (req, res) => adminController.getSecurityAlerts(req, res));
router.patch('/security/:id', (req, res) => adminController.updateAlertStatus(req, res));

// Blockchain Explorer & Tampering Simulator
router.get('/blockchain', (req, res) => adminController.getBlockchainProofs(req, res));
router.post('/blockchain/simulate-tampering', (req, res) => adminController.simulateTamperingTest(req, res));

// Emergency Monitoring
router.get('/emergency', (req, res) => adminController.getEmergencySessions(req, res));

// Helpdesk / Support Tickets
router.get('/helpdesk', (req, res) => adminController.getHelpdeskTickets(req, res));
router.patch('/helpdesk/:id', (req, res) => adminController.updateHelpdeskTicket(req, res));

export default router;
