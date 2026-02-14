import { Timestamp } from 'firebase-admin/firestore';

export interface LockedSlot {
  id: string;
  doctorId: string;
  date: Date | Timestamp;
  time: string;
  reason?: string;
  createdAt: Date | Timestamp;
  createdBy: string;
}

export interface CreateLockedSlotDTO {
  doctorId: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  reason?: string;
}
