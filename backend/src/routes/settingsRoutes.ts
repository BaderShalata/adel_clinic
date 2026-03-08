import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

// Public endpoint - mobile app checks this
router.get('/clinic/status', settingsController.getClinicStatus.bind(settingsController));

// Admin only
router.use(authenticate);
router.use(authorizeAdmin);
router.post('/clinic/lock', settingsController.setClinicLock.bind(settingsController));

export default router;
