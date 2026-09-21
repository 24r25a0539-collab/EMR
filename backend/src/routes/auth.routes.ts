import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Patient Authentication
router.post('/patient/registration-request-otp', (req, res) => authController.patientRegistrationRequestOtp(req, res));
router.post('/patient/registration-verify-otp', (req, res) => authController.patientRegistrationVerifyOtp(req, res));
router.post('/patient/request-otp', (req, res) => authController.patientRequestOtp(req, res));
router.post('/patient/verify-otp', (req, res) => authController.patientVerifyOtp(req, res));
router.post('/patient/register', (req, res) => authController.patientRegister(req, res));

// Doctor Authentication
router.post('/doctor/login', (req, res) => authController.doctorLogin(req, res));
router.post('/doctor/register', (req, res) => authController.doctorRegister(req, res));
router.post('/doctor/change-password', authenticateToken, (req, res) => authController.doctorChangePassword(req, res));

// Admin Authentication (Isolated entrance)
router.post('/admin/login', (req, res) => authController.adminLogin(req, res));

// Context & Preferences
router.get('/me', authenticateToken, (req, res) => authController.getMe(req, res));
router.patch('/language', authenticateToken, (req, res) => authController.updateLanguage(req, res));

export default router;
