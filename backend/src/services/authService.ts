import * as admin from 'firebase-admin';
import { User } from '../models/User';
import { patientService } from './patientService';

const db = admin.firestore();
const auth = admin.auth();

export interface RegisterInput {
  email: string;
  displayName: string;
  phoneNumber?: string;
  idNumber?: string;
  gender?: 'male' | 'female' | 'other';
  role?: 'patient' | 'doctor' | 'admin';
}

export interface AuthUser extends User {
  patientId?: string;
}

export class AuthService {
  private usersCollection = db.collection('users');

  /**
   * Register a new user and create a patient record
   * Called after Firebase Auth user is already created from mobile
   */
  async registerUser(uid: string, data: RegisterInput): Promise<AuthUser> {
    try {
      // Check if user already exists in Firestore
      const existingUser = await this.usersCollection.doc(uid).get();
      if (existingUser.exists) {
        // User already registered, return existing data
        const userData = existingUser.data() as User;
        // Ensure we don't duplicate uid when spreading
        const { uid: _maybeUid, ...userDataNoUid } = userData as any;
        const patient = await patientService.getPatientByUserId(uid);
        return {
          uid,
          ...userDataNoUid,
          patientId: patient?.id,
        };
      }

      const role = data.role || 'patient';

      // Set custom claims for role
      await auth.setCustomUserClaims(uid, { role });

      // Create Firestore user document - avoid undefined values
      const userData: Record<string, any> = {
        email: data.email,
        fullName: data.displayName,
        role,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        isActive: true,
      };

      // Only add optional fields if they have values
      if (data.phoneNumber) {
        userData.phoneNumber = data.phoneNumber;
      }

      await this.usersCollection.doc(uid).set(userData);

      let patientId: string | undefined;

      // If role is patient, also create a patient record
      if (role === 'patient') {
        const patient = await patientService.createPatient({
          userId: uid,
          fullName: data.displayName,
          dateOfBirth: new Date(2000, 0, 1), // Default date, can be updated later
          gender: data.gender || 'other',
          phoneNumber: data.phoneNumber || '',
          email: data.email,
          idNumber: data.idNumber,
        });
        patientId = patient.id;
      }

      return {
        uid,
        ...userData,
        patientId,
      } as AuthUser;
    } catch (error: any) {
      throw new Error(`Failed to register user: ${error.message}`);
    }
  }

  /**
   * Get user by UID, creating user record if needed
   */
  async getUserByUid(uid: string): Promise<AuthUser | null> {
    try {
      const doc = await this.usersCollection.doc(uid).get();

      if (!doc.exists) {
        // User exists in Firebase Auth but not in Firestore
        // This shouldn't happen normally, but handle it gracefully
        const firebaseUser = await auth.getUser(uid);
        if (firebaseUser) {
          // Auto-create user record
          return await this.registerUser(uid, {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Unknown',
            phoneNumber: firebaseUser.phoneNumber,
          });
        }
        return null;
      }

      const userData = doc.data() as User;

      // Get patient record if exists
      let patientId: string | undefined;
      if (userData.role === 'patient') {
        const patient = await patientService.getPatientByUserId(uid);
        patientId = patient?.id;
      }

      // Avoid duplicating uid if userData already contains it
      const { uid: _maybeUid2, ...userDataNoUid2 } = userData as any;
      return {
        uid: doc.id,
        ...userDataNoUid2,
        patientId,
      };
    } catch (error: any) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Verify Firebase ID token and return decoded token
   */
  async verifyToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await auth.verifyIdToken(idToken);
    } catch (error: any) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }
}

export const authService = new AuthService();
