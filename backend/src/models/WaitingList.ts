import { Timestamp } from 'firebase-admin/firestore';

export interface WaitingListEntry {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  serviceType: string;
  preferredDate: Timestamp;
  status: 'waiting' | 'notified' | 'booked' | 'cancelled';
  priority: number; // Lower number = higher priority
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateWaitingListInput {
  patientId: string;
  doctorId: string;
  serviceType: string;
  preferredDate: Date | Timestamp;
  priority?: number;
  notes?: string;
}

export interface UpdateWaitingListInput {
  preferredDate?: Date | Timestamp;
  status?: 'waiting' | 'notified' | 'booked' | 'cancelled';
  priority?: number;
  notes?: string;
}
