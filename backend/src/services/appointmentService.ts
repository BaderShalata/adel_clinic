import * as admin from 'firebase-admin';
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '../models/Appointment';
import { lockedSlotService } from './lockedSlotService';

const db = admin.firestore();

export class AppointmentService {
  private appointmentsCollection = db.collection('appointments');
  private patientsCollection = db.collection('patients');
  private doctorsCollection = db.collection('doctors');

  /**
   * Create appointment using Firestore transaction to ensure atomicity.
   * This prevents double-booking race conditions by checking availability
   * and creating the appointment in a single atomic operation.
   */
  async createAppointment(
    data: CreateAppointmentInput,
    createdBy: string,
    role: 'admin' | 'user'
  ): Promise<Appointment> {
    try {
      // Convert appointmentDate to Date object - handle all formats (outside transaction)
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

      const dateStr = appointmentDateObj.toISOString().split('T')[0];

      // Check if slot is locked (outside transaction - locked slots are admin-controlled)
      if (data.appointmentTime) {
        const isLocked = await lockedSlotService.isSlotLocked(data.doctorId, dateStr, data.appointmentTime);
        if (isLocked) {
          throw new Error('This time slot is locked and not available for booking.');
        }
      }

      // Use transaction to ensure atomic check-and-create
      const result = await db.runTransaction(async (transaction) => {
        // Fetch patient and doctor details within transaction
        const patientDoc = await transaction.get(this.patientsCollection.doc(data.patientId));
        const doctorDoc = await transaction.get(this.doctorsCollection.doc(data.doctorId));

        if (!patientDoc.exists) {
          throw new Error('Patient not found');
        }
        if (!doctorDoc.exists) {
          throw new Error('Doctor not found');
        }

        const patient = patientDoc.data();
        const doctor = doctorDoc.data();

        // === ROLE-BASED ACCESS ===
        if (role !== 'admin') {
          if (patient?.createdBy && patient.createdBy !== createdBy) {
            throw new Error('Cannot create appointment for another user');
          }
        }

        // Check for double-booking within the transaction
        if (data.appointmentTime) {
          const existingAppointments = await transaction.get(
            this.appointmentsCollection
              .where('doctorId', '==', data.doctorId)
              .where('appointmentTime', '==', data.appointmentTime)
          );

          for (const doc of existingAppointments.docs) {
            const aptData = doc.data();
            if (aptData.appointmentDate) {
              let aptDate: Date;
              const dateVal = aptData.appointmentDate as any;
              if (typeof dateVal.toDate === 'function') {
                aptDate = dateVal.toDate();
              } else if (typeof dateVal._seconds === 'number') {
                aptDate = new Date(dateVal._seconds * 1000);
              } else {
                continue;
              }
              const aptDateStr = aptDate.toISOString().split('T')[0];
              if (aptDateStr === dateStr && ['pending', 'scheduled', 'completed'].includes(aptData.status)) {
                throw new Error('This time slot is no longer available. Please select another time.');
              }
            }
          }
        }

        // Build appointment data
        const appointmentData: Record<string, any> = {
          patientId: data.patientId,
          doctorId: data.doctorId,
          appointmentDate: admin.firestore.Timestamp.fromDate(appointmentDateObj),
          status: role === 'admin' ? 'scheduled' : 'pending',
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
          createdBy,
        };

        // Only add optional fields if they have values
        if (patient?.fullName) appointmentData.patientName = patient.fullName;
        if (doctor?.fullName) appointmentData.doctorName = doctor.fullName;
        if (data.appointmentTime) appointmentData.appointmentTime = data.appointmentTime;
        if (data.serviceType) appointmentData.serviceType = data.serviceType;
        if (data.duration) appointmentData.duration = data.duration;
        if (data.notes) appointmentData.notes = data.notes;

        // Create the appointment document
        const newDocRef = this.appointmentsCollection.doc();
        transaction.set(newDocRef, appointmentData);

        return {
          id: newDocRef.id,
          ...appointmentData,
        } as Appointment;
      });

      return result;
    } catch (error: any) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }
  }

  async checkSlotAvailability(doctorId: string, date: Date, time: string): Promise<boolean> {
    try {
      const dateStr = date.toISOString().split('T')[0];

      // Check if the slot is locked
      const isLocked = await lockedSlotService.isSlotLocked(doctorId, dateStr, time);
      if (isLocked) {
        return false;
      }

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
          if (aptDateStr === dateStr && ['pending', 'scheduled', 'completed'].includes(data.status)) {
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

      // When filtering by status only (without date), we need to avoid the composite index requirement
      // by querying without orderBy and sorting in memory
      const hasDateFilter = filters?.startDate || filters?.endDate;
      const hasStatusOnly = filters?.status && !hasDateFilter;

      if (filters?.status) query = query.where('status', '==', filters.status);
      if (filters?.doctorId) query = query.where('doctorId', '==', filters.doctorId);
      if (filters?.patientId) query = query.where('patientId', '==', filters.patientId);
      if (filters?.startDate) query = query.where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(filters.startDate));
      if (filters?.endDate) query = query.where('appointmentDate', '<=', admin.firestore.Timestamp.fromDate(filters.endDate));

      // Only use orderBy when we have date filters (to avoid needing composite index for status + date)
      if (!hasStatusOnly) {
        query = query.orderBy('appointmentDate', 'desc');
      }

      const snapshot = await query.get();
      let appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));

      // Sort in memory if we couldn't use orderBy
      if (hasStatusOnly) {
        appointments.sort((a, b) => {
          const dateA = a.appointmentDate instanceof Date
            ? a.appointmentDate
            : (a.appointmentDate as any).toDate?.() || new Date((a.appointmentDate as any)._seconds * 1000);
          const dateB = b.appointmentDate instanceof Date
            ? b.appointmentDate
            : (b.appointmentDate as any).toDate?.() || new Date((b.appointmentDate as any)._seconds * 1000);
          return dateB.getTime() - dateA.getTime(); // desc order
        });
      }

      return appointments;
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

  /**
   * Book appointment with automatic patient creation in a single atomic transaction.
   * Creates patient if not exists, then creates the appointment - all or nothing.
   */
  async bookAppointmentAtomic(
    data: CreateAppointmentInput,
    userId: string,
    userEmail: string,
    userName: string
  ): Promise<Appointment> {
    try {
      // Convert appointmentDate to Date object
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

      const dateStr = appointmentDateObj.toISOString().split('T')[0];

      // Check if slot is locked (outside transaction)
      if (data.appointmentTime) {
        const isLocked = await lockedSlotService.isSlotLocked(data.doctorId, dateStr, data.appointmentTime);
        if (isLocked) {
          throw new Error('This time slot is locked and not available for booking.');
        }
      }

      // Use transaction for atomic patient creation + appointment booking
      const result = await db.runTransaction(async (transaction) => {
        // === ALL READS FIRST ===
        const patientRef = this.patientsCollection.doc(userId);
        const patientDoc = await transaction.get(patientRef);

        const doctorDoc = await transaction.get(this.doctorsCollection.doc(data.doctorId));
        if (!doctorDoc.exists) {
          throw new Error('Doctor not found');
        }
        const doctor = doctorDoc.data();

        // Read existing appointments for double-booking check
        let existingAppointments: FirebaseFirestore.QuerySnapshot | null = null;
        if (data.appointmentTime) {
          existingAppointments = await transaction.get(
            this.appointmentsCollection
              .where('doctorId', '==', data.doctorId)
              .where('appointmentTime', '==', data.appointmentTime)
          );
        }

        // === ALL VALIDATION (using read results) ===
        let patientName = userName || 'Patient';
        if (patientDoc.exists) {
          patientName = patientDoc.data()?.fullName || userName || 'Patient';
        }

        if (existingAppointments) {
          for (const doc of existingAppointments.docs) {
            const aptData = doc.data();
            if (aptData.appointmentDate) {
              let aptDate: Date;
              const dateVal = aptData.appointmentDate as any;
              if (typeof dateVal.toDate === 'function') {
                aptDate = dateVal.toDate();
              } else if (typeof dateVal._seconds === 'number') {
                aptDate = new Date(dateVal._seconds * 1000);
              } else {
                continue;
              }
              const aptDateStr = aptDate.toISOString().split('T')[0];
              if (aptDateStr === dateStr && ['pending', 'scheduled', 'completed'].includes(aptData.status)) {
                throw new Error('This time slot is no longer available. Please select another time.');
              }
            }
          }
        }

        // === ALL WRITES LAST ===
        // Create patient if not exists
        if (!patientDoc.exists) {
          const patientData = {
            userId,
            email: userEmail || '',
            fullName: userName || 'Patient',
            role: 'patient',
            isActive: true,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          };
          transaction.set(patientRef, patientData);
        }

        // Build appointment data
        const appointmentData: Record<string, any> = {
          patientId: userId,
          doctorId: data.doctorId,
          appointmentDate: admin.firestore.Timestamp.fromDate(appointmentDateObj),
          status: 'pending',
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
          createdBy: userId,
          patientName,
        };

        if (doctor?.fullName) appointmentData.doctorName = doctor.fullName;
        if (data.appointmentTime) appointmentData.appointmentTime = data.appointmentTime;
        if (data.serviceType) appointmentData.serviceType = data.serviceType;
        if (data.duration) appointmentData.duration = data.duration;
        if (data.notes) appointmentData.notes = data.notes;

        // Create the appointment
        const newDocRef = this.appointmentsCollection.doc();
        transaction.set(newDocRef, appointmentData);

        return {
          id: newDocRef.id,
          ...appointmentData,
        } as Appointment;
      });

      return result;
    } catch (error: any) {
      throw new Error(`Failed to book appointment: ${error.message}`);
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
