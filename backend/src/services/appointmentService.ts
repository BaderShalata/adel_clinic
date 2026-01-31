import * as admin from 'firebase-admin';
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '../models/Appointment';

const db = admin.firestore();

export class AppointmentService {
  private appointmentsCollection = db.collection('appointments');
  private patientsCollection = db.collection('patients');
  private doctorsCollection = db.collection('doctors');

  async createAppointment(data: CreateAppointmentInput, createdBy: string): Promise<Appointment> {
    try {
      // Fetch patient and doctor details
      const [patientDoc, doctorDoc] = await Promise.all([
        this.patientsCollection.doc(data.patientId).get(),
        this.doctorsCollection.doc(data.doctorId).get(),
      ]);

      if (!patientDoc.exists) {
        throw new Error('Patient not found');
      }
      if (!doctorDoc.exists) {
        throw new Error('Doctor not found');
      }

      const patient = patientDoc.data();
      const doctor = doctorDoc.data();

      const appointmentData: Omit<Appointment, 'id'> = {
        patientId: data.patientId,
        patientName: patient?.fullName || '',
        doctorId: data.doctorId,
        doctorName: doctor?.fullName || '',
        appointmentDate: data.appointmentDate instanceof Date
          ? admin.firestore.Timestamp.fromDate(data.appointmentDate)
          : data.appointmentDate,
        duration: data.duration,
        status: 'scheduled',
        notes: data.notes,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        createdBy,
      };

      const docRef = await this.appointmentsCollection.add(appointmentData);

      return {
        id: docRef.id,
        ...appointmentData,
      };
    } catch (error: any) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const doc = await this.appointmentsCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as Appointment;
    } catch (error: any) {
      throw new Error(`Failed to get appointment: ${error.message}`);
    }
  }

  async getAllAppointments(filters?: {
    status?: string;
    doctorId?: string;
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Appointment[]> {
    try {
      let query: FirebaseFirestore.Query = this.appointmentsCollection;

      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters?.doctorId) {
        query = query.where('doctorId', '==', filters.doctorId);
      }
      if (filters?.patientId) {
        query = query.where('patientId', '==', filters.patientId);
      }
      if (filters?.startDate) {
        query = query.where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(filters.startDate));
      }
      if (filters?.endDate) {
        query = query.where('appointmentDate', '<=', admin.firestore.Timestamp.fromDate(filters.endDate));
      }

      query = query.orderBy('appointmentDate', 'desc');

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error: any) {
      throw new Error(`Failed to get appointments: ${error.message}`);
    }
  }

  async updateAppointment(id: string, data: UpdateAppointmentInput): Promise<Appointment> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: admin.firestore.Timestamp.now(),
      };

      if (data.appointmentDate && data.appointmentDate instanceof Date) {
        updateData.appointmentDate = admin.firestore.Timestamp.fromDate(data.appointmentDate);
      }

      await this.appointmentsCollection.doc(id).update(updateData);

      const updatedAppointment = await this.getAppointmentById(id);
      if (!updatedAppointment) {
        throw new Error('Appointment not found after update');
      }

      return updatedAppointment;
    } catch (error: any) {
      throw new Error(`Failed to update appointment: ${error.message}`);
    }
  }

  async deleteAppointment(id: string): Promise<void> {
    try {
      await this.appointmentsCollection.doc(id).delete();
    } catch (error: any) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  async getTodayAppointments(doctorId?: string): Promise<Appointment[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let query: FirebaseFirestore.Query = this.appointmentsCollection
        .where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(today))
        .where('appointmentDate', '<', admin.firestore.Timestamp.fromDate(tomorrow));

      if (doctorId) {
        query = query.where('doctorId', '==', doctorId);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error: any) {
      throw new Error(`Failed to get today's appointments: ${error.message}`);
    }
  }
}

export const appointmentService = new AppointmentService();
