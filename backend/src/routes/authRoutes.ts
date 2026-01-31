import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public endpoints that rely on Firebase ID token in Authorization header
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Set admin claims for web admin users (call after signup)
router.post('/set-admin-claims', authController.setAdminClaims.bind(authController));

// Protected endpoint to get current user
router.get('/me', authenticate, authController.getMe.bind(authController));

export default router;
