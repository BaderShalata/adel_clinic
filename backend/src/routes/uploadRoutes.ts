import { Router } from 'express';
import { uploadController } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Upload image (accepts base64 data)
router.post('/image', uploadController.uploadImage.bind(uploadController));

// Delete image
router.delete('/image', uploadController.deleteImage.bind(uploadController));

export default router;
