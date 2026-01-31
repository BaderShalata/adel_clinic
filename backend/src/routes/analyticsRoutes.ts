import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate, authorizeDoctorOrAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeDoctorOrAdmin);

router.get('/', analyticsController.getAnalytics.bind(analyticsController));
router.get('/trends', analyticsController.getAppointmentTrends.bind(analyticsController));

export default router;
