import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All notification endpoints require valid JWT authentication (Patient, Doctor, Admin)
router.use(authenticateToken);

router.get('/', (req, res) => notificationController.getNotifications(req, res));
router.get('/me', (req, res) => notificationController.getNotifications(req, res));
router.patch('/:id/read', (req, res) => notificationController.markNotificationRead(req, res));
router.post('/:id/read', (req, res) => notificationController.markNotificationRead(req, res));
router.delete('/:id', (req, res) => notificationController.deleteNotification(req, res));

export default router;
