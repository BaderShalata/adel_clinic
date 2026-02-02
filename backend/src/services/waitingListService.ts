import * as admin from 'firebase-admin';
import { WaitingListEntry, CreateWaitingListInput, UpdateWaitingListInput } from '../models/WaitingList';

const db = admin.firestore();

export class WaitingListService {
  private waitingListCollection = db.collection('waitingList');
  private patientsCollection = db.collection('patients');
  private doctorsCollection = db.collection('doctors');

  async addToWaitingList(data: CreateWaitingListInput, createdBy: string): Promise<WaitingListEntry> {
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

      // Get the next priority number for this doctor
      // Use simple query to avoid needing composite index
      const existingEntries = await this.waitingListCollection
        .where('doctorId', '==', data.doctorId)
        .where('status', '==', 'waiting')
        .get();

      const maxPriority = existingEntries.docs.reduce((max, doc) => {
        const priority = doc.data().priority || 0;
        return priority > max ? priority : max;
      }, 0);

      const entryData: Omit<WaitingListEntry, 'id'> = {
        patientId: data.patientId,
        patientName: patient?.fullName || '',
        doctorId: data.doctorId,
        doctorName: doctor?.fullName || '',
        serviceType: data.serviceType,
        preferredDate: data.preferredDate instanceof Date
          ? admin.firestore.Timestamp.fromDate(data.preferredDate)
          : data.preferredDate,
        status: 'waiting',
        priority: data.priority ?? (maxPriority + 1),
        notes: data.notes,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        createdBy,
      };

      const docRef = await this.waitingListCollection.add(entryData);

      return {
        id: docRef.id,
        ...entryData,
      };
    } catch (error: any) {
      throw new Error(`Failed to add to waiting list: ${error.message}`);
    }
  }

  async getWaitingListById(id: string): Promise<WaitingListEntry | null> {
    try {
      const doc = await this.waitingListCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as WaitingListEntry;
    } catch (error: any) {
      throw new Error(`Failed to get waiting list entry: ${error.message}`);
    }
  }

  async getWaitingList(filters?: {
    doctorId?: string;
    patientId?: string;
    status?: string;
    date?: Date;
  }): Promise<WaitingListEntry[]> {
    try {
      // Use simple query to avoid needing composite index
      // Filter in memory instead
      const snapshot = await this.waitingListCollection.get();

      let entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WaitingListEntry));

      // Apply filters in memory
      if (filters?.doctorId) {
        entries = entries.filter(e => e.doctorId === filters.doctorId);
      }
      if (filters?.patientId) {
        entries = entries.filter(e => e.patientId === filters.patientId);
      }
      if (filters?.status) {
        entries = entries.filter(e => e.status === filters.status);
      }
      if (filters?.date) {
        const dateStr = filters.date.toISOString().split('T')[0];
        entries = entries.filter(e => {
          const entryDate = (e.preferredDate as any).toDate();
          const entryDateStr = entryDate.toISOString().split('T')[0];
          return entryDateStr === dateStr;
        });
      }

      // Sort by preferredDate then priority
      entries.sort((a, b) => {
        const dateA = (a.preferredDate as any).toDate().getTime();
        const dateB = (b.preferredDate as any).toDate().getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.priority || 0) - (b.priority || 0);
      });

      return entries;
    } catch (error: any) {
      throw new Error(`Failed to get waiting list: ${error.message}`);
    }
  }

  async updateWaitingListEntry(id: string, data: UpdateWaitingListInput): Promise<WaitingListEntry> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: admin.firestore.Timestamp.now(),
      };

      if (data.preferredDate && data.preferredDate instanceof Date) {
        updateData.preferredDate = admin.firestore.Timestamp.fromDate(data.preferredDate);
      }

      await this.waitingListCollection.doc(id).update(updateData);

      const updatedEntry = await this.getWaitingListById(id);
      if (!updatedEntry) {
        throw new Error('Waiting list entry not found after update');
      }

      return updatedEntry;
    } catch (error: any) {
      throw new Error(`Failed to update waiting list entry: ${error.message}`);
    }
  }

  async removeFromWaitingList(id: string): Promise<void> {
    try {
      await this.waitingListCollection.doc(id).delete();
    } catch (error: any) {
      throw new Error(`Failed to remove from waiting list: ${error.message}`);
    }
  }

  async bookFromWaitingList(id: string, appointmentDate: Date, appointmentTime: string, createdBy: string): Promise<any> {
    try {
      const entry = await this.getWaitingListById(id);
      if (!entry) {
        throw new Error('Waiting list entry not found');
      }

      if (entry.status !== 'waiting') {
        throw new Error('This waiting list entry is no longer active');
      }

      // Import appointmentService to create the appointment
      const { appointmentService } = await import('./appointmentService');

      // Create the appointment with the provided date
      // Waiting list bookings are done by admins
      const appointment = await appointmentService.createAppointment({
        patientId: entry.patientId,
        doctorId: entry.doctorId,
        appointmentDate,
        appointmentTime,
        serviceType: entry.serviceType,
        duration: 15, // Default duration
        notes: entry.notes,
      }, createdBy, 'admin');

      // Delete the waiting list entry after successful booking
      await this.removeFromWaitingList(id);

      return appointment;
    } catch (error: any) {
      throw new Error(`Failed to book from waiting list: ${error.message}`);
    }
  }
}

export const waitingListService = new WaitingListService();
