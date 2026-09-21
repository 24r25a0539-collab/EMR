import { Router } from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import doctorRoutes from './doctor.routes.js';
import adminRoutes from './admin.routes.js';
import commonRoutes from './common.routes.js';
import notificationRoutes from './notification.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/me/notifications', notificationRoutes);
apiRouter.use('/patients', patientRoutes);
apiRouter.use('/patient', patientRoutes);
apiRouter.use('/documents', patientRoutes);
apiRouter.use('/', commonRoutes);
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/doctor', doctorRoutes);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;


