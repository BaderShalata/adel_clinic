import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public endpoints that rely on Firebase ID token in Authorization header
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/check-email', authController.checkEmail.bind(authController));

// Set admin claims for web admin users (call after signup)
router.post('/set-admin-claims', authController.setAdminClaims.bind(authController));

// Update FCM token for push notifications
router.put('/fcm-token', authenticate, authController.updateFcmToken.bind(authController));

// Protected endpoint to get current user
router.get('/me', authenticate, authController.getMe.bind(authController));

// Protected endpoint to update user profile
router.put('/profile', authenticate, authController.updateProfile.bind(authController));

export default router;
