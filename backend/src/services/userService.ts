import * as admin from 'firebase-admin';
import { User, CreateUserInput, UpdateUserInput } from '../models/User';
import { appointmentService } from './appointmentService';

const db = admin.firestore();
const auth = admin.auth();

export class UserService {
  private usersCollection = db.collection('users');

  async createUser(data: CreateUserInput): Promise<User> {
    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.fullName,
      });

      // Set custom claims for role
      await auth.setCustomUserClaims(userRecord.uid, { role: data.role });

      // Create Firestore user document
      const userData: Omit<User, 'uid'> = {
        email: data.email,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        role: data.role,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        isActive: true,
      };

      await this.usersCollection.doc(userRecord.uid).set(userData);

      // If created via admin panel with an admin role, also add to admins collection
      const roleLower = (data.role || '').toString().toLowerCase();
      if (roleLower.includes('admin')) {
        const adminsCollection = db.collection('admins');
        await adminsCollection.doc(userRecord.uid).set(userData);
      }

      return {
        uid: userRecord.uid,
        ...userData,
      };
    } catch (error: any) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUserById(uid: string): Promise<User | null> {
    try {
      const doc = await this.usersCollection.doc(uid).get();
      if (!doc.exists) {
        return null;
      }
      return { uid: doc.id, ...doc.data() } as User;
    } catch (error: any) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async getAllUsers(role?: 'admin' | 'doctor' | 'patient'): Promise<User[]> {
    try {
      let query: FirebaseFirestore.Query = this.usersCollection;

      if (role) {
        query = query.where('role', '==', role);
      }

      const snapshot = await query.get();
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User));

      // Enrich users with data from patients collection (joint query)
      const patientsSnapshot = await db.collection('patients').get();
      const patientMap = new Map<string, Record<string, any>>();
      for (const pDoc of patientsSnapshot.docs) {
        const pData = pDoc.data();
        const key = pData.userId || pDoc.id;
        patientMap.set(key, pData);
        // Also map by doc ID if userId is different
        if (pData.userId && pData.userId !== pDoc.id) {
          patientMap.set(pDoc.id, pData);
        }
      }

      for (const user of users) {
        const patient = patientMap.get(user.uid);
        if (patient) {
          if (!user.idNumber && patient.idNumber) user.idNumber = patient.idNumber;
          if (!(user as any).gender && patient.gender) (user as any).gender = patient.gender;
          if (!user.phoneNumber && patient.phoneNumber) user.phoneNumber = patient.phoneNumber;
        }
      }

      return users;
    } catch (error: any) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  async updateUser(uid: string, data: UpdateUserInput): Promise<User> {
    try {
      const updateData = {
        ...data,
        updatedAt: admin.firestore.Timestamp.now(),
      };

      await this.usersCollection.doc(uid).update(updateData);

      // Update display name in Auth if fullName is provided
      if (data.fullName) {
        await auth.updateUser(uid, { displayName: data.fullName });
      }

      // Sync relevant fields to patients collection
      const syncFields: Record<string, any> = {};
      if (data.fullName) syncFields.fullName = data.fullName;
      if (data.phoneNumber !== undefined) syncFields.phoneNumber = data.phoneNumber;
      if ((data as any).idNumber !== undefined) syncFields.idNumber = (data as any).idNumber;

      if (Object.keys(syncFields).length > 0) {
        // Find patient doc by userId field matching this uid
        const patientsSnapshot = await db.collection('patients').where('userId', '==', uid).get();
        if (!patientsSnapshot.empty) {
          for (const doc of patientsSnapshot.docs) {
            await doc.ref.update({ ...syncFields, updatedAt: admin.firestore.Timestamp.now() });
          }
        }
        // Also check if patient doc ID matches uid directly
        const directPatientDoc = await db.collection('patients').doc(uid).get();
        if (directPatientDoc.exists && patientsSnapshot.empty) {
          await directPatientDoc.ref.update({ ...syncFields, updatedAt: admin.firestore.Timestamp.now() });
        }
      }

      const updatedUser = await this.getUserById(uid);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      return updatedUser;
    } catch (error: any) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      // Delete appointments linked to this user's UID
      await appointmentService.deleteAppointmentsByPatientId(uid);

      // Delete from Firebase Auth
      await auth.deleteUser(uid);
      // Delete from Firestore users collection
      await this.usersCollection.doc(uid).delete();

      // Delete corresponding patient record and their appointments
      // Check by userId field
      const patientsSnapshot = await db.collection('patients').where('userId', '==', uid).get();
      for (const doc of patientsSnapshot.docs) {
        await appointmentService.deleteAppointmentsByPatientId(doc.id);
        await doc.ref.delete();
      }
      // Also check if patient doc ID matches uid directly
      const directPatientDoc = await db.collection('patients').doc(uid).get();
      if (directPatientDoc.exists) {
        await appointmentService.deleteAppointmentsByPatientId(uid);
        await directPatientDoc.ref.delete();
      }
    } catch (error: any) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async deactivateUser(uid: string): Promise<void> {
    try {
      await this.usersCollection.doc(uid).update({
        isActive: false,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      await auth.updateUser(uid, { disabled: true });
    } catch (error: any) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
  }

  async activateUser(uid: string): Promise<void> {
    try {
      await this.usersCollection.doc(uid).update({
        isActive: true,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      await auth.updateUser(uid, { disabled: false });
    } catch (error: any) {
      throw new Error(`Failed to activate user: ${error.message}`);
    }
  }
}

export const userService = new UserService();
