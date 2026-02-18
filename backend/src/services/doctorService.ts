import * as admin from 'firebase-admin';
import { Doctor, CreateDoctorInput, UpdateDoctorInput } from '../models/Doctor';

const db = admin.firestore();

export class DoctorService {
  private doctorsCollection = db.collection('doctors');

  async createDoctor(data: CreateDoctorInput): Promise<Doctor> {
    try {
      // Clean schedule entries - remove undefined values that Firestore doesn't accept
      const cleanSchedule = (data.schedule || []).map(entry => {
        const clean: any = {
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          slotDuration: entry.slotDuration,
        };
        // Only include type if it's defined and not empty
        if (entry.type !== undefined && entry.type !== null && entry.type !== '') {
          clean.type = entry.type;
        }
        return clean;
      });

      // Build doctor data, excluding undefined optional fields
      const doctorData: any = {
        userId: data.userId,
        fullName: data.fullName,
        specialties: data.specialties || [],
        qualifications: data.qualifications || [],
        schedule: cleanSchedule,
        isActive: true,
        createdAt: admin.firestore.Timestamp.now(),
      };

      // Only add optional fields if they have values
      if (data.fullNameEn) doctorData.fullNameEn = data.fullNameEn;
      if (data.fullNameHe) doctorData.fullNameHe = data.fullNameHe;
      if (data.specialtiesEn?.length) doctorData.specialtiesEn = data.specialtiesEn;
      if (data.specialtiesHe?.length) doctorData.specialtiesHe = data.specialtiesHe;
      if (data.qualificationsEn?.length) doctorData.qualificationsEn = data.qualificationsEn;
      if (data.qualificationsHe?.length) doctorData.qualificationsHe = data.qualificationsHe;
      if (data.bio) doctorData.bio = data.bio;
      if (data.bioEn) doctorData.bioEn = data.bioEn;
      if (data.bioHe) doctorData.bioHe = data.bioHe;
      if (data.imageUrl) doctorData.imageUrl = data.imageUrl;

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
      // Clean the update data - remove undefined values
      const cleanData: any = {};

      // Copy defined values only
      if (data.fullName !== undefined) cleanData.fullName = data.fullName;
      if (data.fullNameEn !== undefined) cleanData.fullNameEn = data.fullNameEn;
      if (data.fullNameHe !== undefined) cleanData.fullNameHe = data.fullNameHe;
      if (data.specialties !== undefined) cleanData.specialties = data.specialties;
      if (data.specialtiesEn !== undefined) cleanData.specialtiesEn = data.specialtiesEn;
      if (data.specialtiesHe !== undefined) cleanData.specialtiesHe = data.specialtiesHe;
      if (data.qualifications !== undefined) cleanData.qualifications = data.qualifications;
      if (data.qualificationsEn !== undefined) cleanData.qualificationsEn = data.qualificationsEn;
      if (data.qualificationsHe !== undefined) cleanData.qualificationsHe = data.qualificationsHe;
      if (data.bio !== undefined) cleanData.bio = data.bio;
      if (data.bioEn !== undefined) cleanData.bioEn = data.bioEn;
      if (data.bioHe !== undefined) cleanData.bioHe = data.bioHe;
      if (data.imageUrl !== undefined) cleanData.imageUrl = data.imageUrl;
      if (data.isActive !== undefined) cleanData.isActive = data.isActive;

      // Clean schedule entries if present
      if (data.schedule !== undefined) {
        cleanData.schedule = data.schedule.map(entry => {
          const clean: any = {
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            slotDuration: entry.slotDuration,
          };
          if (entry.type !== undefined && entry.type !== null && entry.type !== '') {
            clean.type = entry.type;
          }
          return clean;
        });
      }

      await this.doctorsCollection.doc(id).update(cleanData);

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
