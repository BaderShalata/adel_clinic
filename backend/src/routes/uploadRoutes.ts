import { Router } from 'express';
import { uploadController } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Upload image (accepts base64 data)
router.post('/image', uploadController.uploadImage.bind(uploadController));

export default router;
