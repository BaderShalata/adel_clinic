import * as admin from 'firebase-admin'; 
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '../models/Appointment';

const db = admin.firestore();

export class AppointmentService {
  private appointmentsCollection = db.collection('appointments');
  private patientsCollection = db.collection('patients');
  private doctorsCollection = db.collection('doctors');

  async createAppointment(
    data: CreateAppointmentInput, 
    createdBy: string,
    role: 'admin' | 'user'
  ): Promise<Appointment> {
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

      // === ROLE-BASED ACCESS ===
      // Admin can create for anyone
      if (role !== 'admin') {
        if (patient?.createdBy && patient.createdBy !== createdBy) {
          throw new Error('Cannot create appointment for another user');
        }
      }

      // Convert appointmentDate to Date object - handle all formats
      let appointmentDateObj: Date;
      const aptDateInput = data.appointmentDate as any;
      if (aptDateInput instanceof Date) {
        appointmentDateObj = aptDateInput;
      } else if (typeof aptDateInput === 'string') {
        appointmentDateObj = new Date(aptDateInput);
      } else if (typeof aptDateInput._seconds === 'number') {
        appointmentDateObj = new Date(aptDateInput._seconds * 1000);
      } else if (typeof aptDateInput.toDate === 'function') {
        appointmentDateObj = aptDateInput.toDate();
      } else {
        throw new Error('Invalid appointment date format');
      }

      // Check for double-booking if appointmentTime is provided
      if (data.appointmentTime) {
        const isAvailable = await this.checkSlotAvailability(
          data.doctorId,
          appointmentDateObj,
          data.appointmentTime
        );

        if (!isAvailable) {
          throw new Error('This time slot is no longer available. Please select another time.');
        }
      }

      const appointmentData: Omit<Appointment, 'id'> = {
        patientId: data.patientId,
        patientName: patient?.fullName || '',
        doctorId: data.doctorId,
        doctorName: doctor?.fullName || '',
        appointmentDate: admin.firestore.Timestamp.fromDate(appointmentDateObj),
        appointmentTime: data.appointmentTime || '',
        serviceType: data.serviceType || '',
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

  async checkSlotAvailability(doctorId: string, date: Date, time: string): Promise<boolean> {
    try {
      const dateStr = date.toISOString().split('T')[0];

      const existingAppointments = await this.appointmentsCollection
        .where('doctorId', '==', doctorId)
        .get();

      for (const doc of existingAppointments.docs) {
        const data = doc.data();
        if (data.appointmentDate && data.appointmentTime === time) {
          // Handle different date formats
          let aptDate: Date;
          const dateVal = data.appointmentDate as any;
          if (typeof dateVal.toDate === 'function') {
            aptDate = dateVal.toDate();
          } else if (typeof dateVal._seconds === 'number') {
            aptDate = new Date(dateVal._seconds * 1000);
          } else if (typeof dateVal === 'string') {
            aptDate = new Date(dateVal);
          } else {
            continue;
          }
          const aptDateStr = aptDate.toISOString().split('T')[0];
          if (aptDateStr === dateStr && ['scheduled', 'completed'].includes(data.status)) {
            return false;
          }
        }
      }

      return true;
    } catch (error: any) {
      throw new Error(`Failed to check slot availability: ${error.message}`);
    }
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const doc = await this.appointmentsCollection.doc(id).get();
      if (!doc.exists) return null;
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

      if (filters?.status) query = query.where('status', '==', filters.status);
      if (filters?.doctorId) query = query.where('doctorId', '==', filters.doctorId);
      if (filters?.patientId) query = query.where('patientId', '==', filters.patientId);
      if (filters?.startDate) query = query.where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(filters.startDate));
      if (filters?.endDate) query = query.where('appointmentDate', '<=', admin.firestore.Timestamp.fromDate(filters.endDate));

      query = query.orderBy('appointmentDate', 'desc');

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error: any) {
      throw new Error(`Failed to get appointments: ${error.message}`);
    }
  }

  async updateAppointment(id: string, data: UpdateAppointmentInput): Promise<Appointment> {
    try {
      const updateData: any = { ...data, updatedAt: admin.firestore.Timestamp.now() };

      // Handle appointmentDate conversion - support Date, string (ISO), Timestamp, and serialized Timestamp formats
      if (data.appointmentDate) {
        const aptDate = data.appointmentDate as any;
        if (aptDate instanceof Date) {
          updateData.appointmentDate = admin.firestore.Timestamp.fromDate(aptDate);
        } else if (typeof aptDate === 'string') {
          updateData.appointmentDate = admin.firestore.Timestamp.fromDate(new Date(aptDate));
        } else if (typeof aptDate._seconds === 'number') {
          // Serialized Timestamp format { _seconds, _nanoseconds }
          updateData.appointmentDate = new admin.firestore.Timestamp(aptDate._seconds, aptDate._nanoseconds || 0);
        } else if (typeof aptDate.toDate === 'function') {
          // Already a Timestamp instance, keep as is
          updateData.appointmentDate = aptDate;
        }
      }

      await this.appointmentsCollection.doc(id).update(updateData);

      const updatedAppointment = await this.getAppointmentById(id);
      if (!updatedAppointment) throw new Error('Appointment not found after update');

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

      if (doctorId) query = query.where('doctorId', '==', doctorId);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error: any) {
      throw new Error(`Failed to get today's appointments: ${error.message}`);
    }
  }
}

export const appointmentService = new AppointmentService();
