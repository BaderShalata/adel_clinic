import * as admin from 'firebase-admin';
import { User, CreateUserInput, UpdateUserInput } from '../models/User';

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
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User));
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
      // Delete from Firebase Auth
      await auth.deleteUser(uid);
      // Delete from Firestore
      await this.usersCollection.doc(uid).delete();
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
