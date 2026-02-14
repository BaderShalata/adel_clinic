import { Timestamp } from 'firebase-admin/firestore';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: Timestamp;
  appointmentTime: string; // "HH:MM" format
  serviceType: string; // The specialty/service type
  duration: number; // minutes
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // uid of admin who created
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  appointmentDate: Date | Timestamp;
  appointmentTime: string; // "HH:MM" format
  serviceType: string;
  duration: number;
  notes?: string;
}

export interface UpdateAppointmentInput {
  appointmentDate?: Date | Timestamp;
  duration?: number;
  status?: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}
