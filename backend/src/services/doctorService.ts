import * as admin from 'firebase-admin';
import { Doctor, CreateDoctorInput, UpdateDoctorInput } from '../models/Doctor';

const db = admin.firestore();

export class DoctorService {
  private doctorsCollection = db.collection('doctors');

  async createDoctor(data: CreateDoctorInput): Promise<Doctor> {
    try {
      const doctorData: Omit<Doctor, 'id'> = {
        userId: data.userId,
        fullName: data.fullName,
        fullNameEn: data.fullNameEn,
        fullNameHe: data.fullNameHe,
        specialties: data.specialties,
        specialtiesEn: data.specialtiesEn,
        specialtiesHe: data.specialtiesHe,
        qualifications: data.qualifications,
        qualificationsEn: data.qualificationsEn,
        qualificationsHe: data.qualificationsHe,
        schedule: data.schedule,
        isActive: true,
        createdAt: admin.firestore.Timestamp.now(),
      };

      const docRef = await this.doctorsCollection.add(doctorData);

      return {
        id: docRef.id,
        ...doctorData,
      };
    } catch (error: any) {
      throw new Error(`Failed to create doctor: ${error.message}`);
    }
  }

  async getDoctorById(id: string): Promise<Doctor | null> {
    try {
      const doc = await this.doctorsCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as Doctor;
    } catch (error: any) {
      throw new Error(`Failed to get doctor: ${error.message}`);
    }
  }

  async getDoctorByUserId(userId: string): Promise<Doctor | null> {
    try {
      const snapshot = await this.doctorsCollection.where('userId', '==', userId).limit(1).get();
      if (snapshot.empty) {
        return null;
      }
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Doctor;
    } catch (error: any) {
      throw new Error(`Failed to get doctor by userId: ${error.message}`);
    }
  }

  async getAllDoctors(activeOnly: boolean = false): Promise<Doctor[]> {
    try {
      let query: FirebaseFirestore.Query = this.doctorsCollection;

      if (activeOnly) {
        query = query.where('isActive', '==', true);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Doctor));
    } catch (error: any) {
      throw new Error(`Failed to get doctors: ${error.message}`);
    }
  }

  async updateDoctor(id: string, data: UpdateDoctorInput): Promise<Doctor> {
    try {
      await this.doctorsCollection.doc(id).update(data as any);

      const updatedDoctor = await this.getDoctorById(id);
      if (!updatedDoctor) {
        throw new Error('Doctor not found after update');
      }

      return updatedDoctor;
    } catch (error: any) {
      throw new Error(`Failed to update doctor: ${error.message}`);
    }
  }

  async deleteDoctor(id: string): Promise<void> {
    try {
      await this.doctorsCollection.doc(id).delete();
    } catch (error: any) {
      throw new Error(`Failed to delete doctor: ${error.message}`);
    }
  }

  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    try {
      const snapshot = await this.doctorsCollection
        .where('specialties', 'array-contains', specialty)
        .where('isActive', '==', true)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Doctor));
    } catch (error: any) {
      throw new Error(`Failed to get doctors by specialty: ${error.message}`);
    }
  }
}

export const doctorService = new DoctorService();
