import * as admin from 'firebase-admin';
import { LockedSlot, CreateLockedSlotDTO } from '../models/LockedSlot';

const db = admin.firestore();
const lockedSlotsCollection = db.collection('lockedSlots');

// Helper to convert Firestore date to JS Date
const toDate = (dateVal: any): Date => {
  if (dateVal instanceof admin.firestore.Timestamp) {
    return dateVal.toDate();
  }
  if (typeof dateVal?.toDate === 'function') {
    return dateVal.toDate();
  }
  if (typeof dateVal?._seconds === 'number') {
    return new Date(dateVal._seconds * 1000);
  }
  return new Date(dateVal);
};

export const lockedSlotService = {
  /**
   * Create a new locked slot
   */
  async createLockedSlot(data: CreateLockedSlotDTO, createdBy: string): Promise<LockedSlot> {
    // Check if slot is already locked
    const existingLock = await this.getLockedSlot(data.doctorId, data.date, data.time);
    if (existingLock) {
      throw new Error('This slot is already locked');
    }

    const docRef = lockedSlotsCollection.doc();
    const lockedSlot: LockedSlot = {
      id: docRef.id,
      doctorId: data.doctorId,
      date: admin.firestore.Timestamp.fromDate(new Date(data.date)),
      time: data.time,
      reason: data.reason || 'Admin locked',
      createdAt: admin.firestore.Timestamp.now(),
      createdBy,
    };

    await docRef.set(lockedSlot);
    return lockedSlot;
  },

  /**
   * Get a specific locked slot - uses simple query + memory filter to avoid composite index
   */
  async getLockedSlot(doctorId: string, date: string, time: string): Promise<LockedSlot | null> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Simple query by doctorId only, filter in memory
    const snapshot = await lockedSlotsCollection
      .where('doctorId', '==', doctorId)
      .get();

    const match = snapshot.docs.find(doc => {
      const data = doc.data() as LockedSlot;
      if (data.time !== time) return false;
      const slotDate = toDate(data.date);
      return slotDate >= dateStart && slotDate <= dateEnd;
    });

    return match ? (match.data() as LockedSlot) : null;
  },

  /**
   * Check if a specific slot is locked
   */
  async isSlotLocked(doctorId: string, date: string, time: string): Promise<boolean> {
    const lockedSlot = await this.getLockedSlot(doctorId, date, time);
    return lockedSlot !== null;
  },

  /**
   * Get all locked slots for a doctor on a specific date - uses simple query + memory filter
   */
  async getLockedSlotsByDate(doctorId: string, date: Date): Promise<LockedSlot[]> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Simple query by doctorId only, filter date in memory
    const snapshot = await lockedSlotsCollection
      .where('doctorId', '==', doctorId)
      .get();

    return snapshot.docs
      .map(doc => doc.data() as LockedSlot)
      .filter(slot => {
        const slotDate = toDate(slot.date);
        return slotDate >= dateStart && slotDate <= dateEnd;
      });
  },

  /**
   * Get all locked slots for a doctor
   */
  async getLockedSlotsByDoctor(doctorId: string): Promise<LockedSlot[]> {
    const snapshot = await lockedSlotsCollection
      .where('doctorId', '==', doctorId)
      .get();

    // Sort in memory instead of using orderBy to avoid index
    return snapshot.docs
      .map(doc => doc.data() as LockedSlot)
      .sort((a, b) => {
        const dateA = toDate(a.date);
        const dateB = toDate(b.date);
        return dateB.getTime() - dateA.getTime();
      });
  },

  /**
   * Delete a locked slot by ID
   */
  async deleteLockedSlot(id: string): Promise<void> {
    await lockedSlotsCollection.doc(id).delete();
  },

  /**
   * Delete a locked slot by details (doctorId, date, time) - uses simple query + memory filter
   */
  async deleteLockedSlotByDetails(doctorId: string, date: string, time: string): Promise<boolean> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Simple query by doctorId only, filter in memory
    const snapshot = await lockedSlotsCollection
      .where('doctorId', '==', doctorId)
      .get();

    const docsToDelete = snapshot.docs.filter(doc => {
      const data = doc.data() as LockedSlot;
      if (data.time !== time) return false;
      const slotDate = toDate(data.date);
      return slotDate >= dateStart && slotDate <= dateEnd;
    });

    if (docsToDelete.length === 0) {
      return false;
    }

    const batch = db.batch();
    docsToDelete.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return true;
  },
};
