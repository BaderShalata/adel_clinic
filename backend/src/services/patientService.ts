import * as admin from 'firebase-admin';
import { Patient, CreatePatientInput, UpdatePatientInput } from '../models/Patient';

const db = admin.firestore();

export class PatientService {
  private patientsCollection = db.collection('patients');

  async createPatient(data: CreatePatientInput): Promise<Patient> {
    try {
      const patientData: Record<string, any> = {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth instanceof Date
          ? admin.firestore.Timestamp.fromDate(data.dateOfBirth)
          : data.dateOfBirth,
        gender: data.gender,
        phoneNumber: data.phoneNumber || '',
        email: data.email || '',
        allergies: data.allergies || [],
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      // Only add optional fields if they have values (Firestore doesn't accept undefined)
      if (data.userId) patientData.userId = data.userId;
      if (data.idNumber) patientData.idNumber = data.idNumber;
      if (data.address) patientData.address = data.address;
      if (data.medicalHistory) patientData.medicalHistory = data.medicalHistory;
      if (data.emergencyContact) patientData.emergencyContact = data.emergencyContact;

      // Use userId as document ID if provided, otherwise auto-generate
      let docId: string;
      if (data.userId) {
        // Check if patient already exists with this userId
        const existingDoc = await this.patientsCollection.doc(data.userId).get();
        if (existingDoc.exists) {
          return { id: existingDoc.id, ...existingDoc.data() } as Patient;
        }
        await this.patientsCollection.doc(data.userId).set(patientData);
        docId = data.userId;
      } else {
        const docRef = await this.patientsCollection.add(patientData);
        docId = docRef.id;
      }

      return {
        id: docId,
        ...patientData,
      } as Patient;
    } catch (error: any) {
      throw new Error(`Failed to create patient: ${error.message}`);
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    try {
      const doc = await this.patientsCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as Patient;
    } catch (error: any) {
      throw new Error(`Failed to get patient: ${error.message}`);
    }
  }

  async getPatientByUserId(userId: string): Promise<Patient | null> {
    try {
      // First try direct lookup by document ID (new structure)
      const directDoc = await this.patientsCollection.doc(userId).get();
      if (directDoc.exists) {
        return { id: directDoc.id, ...directDoc.data() } as Patient;
      }

      // Fall back to query by userId field (legacy structure)
      const snapshot = await this.patientsCollection.where('userId', '==', userId).limit(1).get();
      if (snapshot.empty) {
        return null;
      }
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Patient;
    } catch (error: any) {
      throw new Error(`Failed to get patient by userId: ${error.message}`);
    }
  }

  async getPatientByIdNumber(idNumber: string): Promise<Patient | null> {
    try {
      const snapshot = await this.patientsCollection.where('idNumber', '==', idNumber).limit(1).get();
      if (snapshot.empty) {
        return null;
      }
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Patient;
    } catch (error: any) {
      throw new Error(`Failed to get patient by ID number: ${error.message}`);
    }
  }

  async isIdNumberTaken(idNumber: string, excludeUserId?: string): Promise<boolean> {
    try {
      const snapshot = await this.patientsCollection.where('idNumber', '==', idNumber).get();
      if (snapshot.empty) {
        return false;
      }
      // If excludeUserId is provided, check if the found patient is the same user (for updates)
      if (excludeUserId) {
        return snapshot.docs.some(doc => doc.id !== excludeUserId && doc.data().userId !== excludeUserId);
      }
      return true;
    } catch (error: any) {
      throw new Error(`Failed to check ID number: ${error.message}`);
    }
  }

  async getAllPatients(search?: string): Promise<Patient[]> {
    try {
      let query: FirebaseFirestore.Query = this.patientsCollection.orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      let patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));

      // Simple client-side search filter
      if (search) {
        const searchLower = search.toLowerCase();
        patients = patients.filter(p =>
          p.fullName.toLowerCase().includes(searchLower) ||
          p.phoneNumber.includes(search) ||
          (p.email && p.email.toLowerCase().includes(searchLower))
        );
      }

      return patients;
    } catch (error: any) {
      throw new Error(`Failed to get patients: ${error.message}`);
    }
  }

  async updatePatient(id: string, data: UpdatePatientInput): Promise<Patient> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: admin.firestore.Timestamp.now(),
      };

      if (data.dateOfBirth && data.dateOfBirth instanceof Date) {
        updateData.dateOfBirth = admin.firestore.Timestamp.fromDate(data.dateOfBirth);
      }

      await this.patientsCollection.doc(id).update(updateData);

      const updatedPatient = await this.getPatientById(id);
      if (!updatedPatient) {
        throw new Error('Patient not found after update');
      }

      return updatedPatient;
    } catch (error: any) {
      throw new Error(`Failed to update patient: ${error.message}`);
    }
  }

  async deletePatient(id: string): Promise<void> {
    try {
      await this.patientsCollection.doc(id).delete();
    } catch (error: any) {
      throw new Error(`Failed to delete patient: ${error.message}`);
    }
  }

  async getPatientStats(): Promise<{
    total: number;
    newThisMonth: number;
  }> {
    try {
      const allPatientsSnapshot = await this.patientsCollection.get();
      const total = allPatientsSnapshot.size;

      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const newThisMonthSnapshot = await this.patientsCollection
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(firstDayOfMonth))
        .get();

      return {
        total,
        newThisMonth: newThisMonthSnapshot.size,
      };
    } catch (error: any) {
      throw new Error(`Failed to get patient stats: ${error.message}`);
    }
  }
}

export const patientService = new PatientService();
