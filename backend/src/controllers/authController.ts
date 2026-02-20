import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { authService, RegisterInput } from '../services/authService';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   * Expects Firebase ID token in Authorization header
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No authorization token provided' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];

      // Verify the Firebase token
      const decodedToken = await authService.verifyToken(idToken);
      const uid = decodedToken.uid;

      // Get registration data from request body
      const data: RegisterInput = {
        email: req.body.email || decodedToken.email || '',
        displayName: req.body.displayName || decodedToken.name || 'Unknown',
        phoneNumber: req.body.phoneNumber,
        idNumber: req.body.idNumber,
        gender: req.body.gender,
        role: req.body.role || 'patient',
      };

      // Register the user and create patient record
      const user = await authService.registerUser(uid, data);

      // Debug log
      console.log('✅ User registered successfully:', uid);

      // Return user data in format expected by mobile app
      res.status(201).json({
        id: user.uid,
        email: user.email,
        displayName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        message: 'Registration successful',
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Full error stack:', error.stack);

      // Handle specific error codes
      if (error.message === 'ID_NUMBER_EXISTS') {
        res.status(409).json({
          error: 'ID_NUMBER_EXISTS',
          errorKey: 'idNumberAlreadyExists',
          message: 'An account with this ID number already exists',
        });
        return;
      }

      res.status(400).json({
        error: error.message,
        details: error.toString(),
      });
    }
  }

  /**
   * Login - verify token and return user data
   * POST /api/auth/login
   * Expects Firebase ID token in Authorization header
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No authorization token provided' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];

      // Verify the Firebase token
      const decodedToken = await authService.verifyToken(idToken);
      const uid = decodedToken.uid;

      // Get user data
      let user = await authService.getUserByUid(uid);

      if (!user) {
        // User doesn't exist in Firestore, create them
        user = await authService.registerUser(uid, {
          email: decodedToken.email || '',
          displayName: decodedToken.name || 'Unknown',
        });
      }

      // Return user data in format expected by mobile app
      res.status(200).json({
        id: user.uid,
        email: user.email,
        displayName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        patientId: user.patientId,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   * Expects Firebase ID token in Authorization header
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No authorization token provided' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await authService.verifyToken(idToken);
      const uid = decodedToken.uid;

      const user = await authService.getUserByUid(uid);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        id: user.uid,
        email: user.email,
        displayName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        patientId: user.patientId,
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   * Expects Firebase ID token in Authorization header
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No authorization token provided' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await authService.verifyToken(idToken);
      const uid = decodedToken.uid;

      const { displayName, phoneNumber, idNumber, gender, photoUrl } = req.body;

      const updatedUser = await authService.updateProfile(uid, {
        displayName,
        phoneNumber,
        idNumber,
        gender,
        photoUrl,
      });

      res.status(200).json({
        id: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        idNumber: updatedUser.idNumber,
        gender: updatedUser.gender,
        photoUrl: (updatedUser as any).photoUrl,
        role: updatedUser.role,
        patientId: updatedUser.patientId,
      });
    } catch (error: any) {
      console.error('Update profile error:', error);

      // Handle specific error codes
      if (error.message === 'ID_NUMBER_EXISTS') {
        res.status(409).json({
          error: 'ID_NUMBER_EXISTS',
          errorKey: 'idNumberAlreadyExists',
          message: 'An account with this ID number already exists',
        });
        return;
      }

      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Set admin claims for web admin users
   * POST /api/auth/set-admin-claims
   * Called after signup to set the admin role in Firebase Auth custom claims
   */
  async setAdminClaims(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No authorization token provided' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await authService.verifyToken(idToken);
      const uid = decodedToken.uid;

      // Check if user exists in Firestore with admin role
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        res.status(404).json({ error: 'User not found in database' });
        return;
      }

      const userData = userDoc.data();
      if (userData?.role !== 'admin') {
        res.status(403).json({ error: 'User is not an admin' });
        return;
      }

      // Set the admin custom claim
      await admin.auth().setCustomUserClaims(uid, { role: 'admin' });

      console.log('✅ Admin claims set for user:', uid);

      res.status(200).json({
        message: 'Admin claims set successfully',
        note: 'Please refresh your token by logging out and back in'
      });
    } catch (error: any) {
      console.error('Set admin claims error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();
