import { Timestamp } from 'firebase-admin/firestore';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Patient {
  id: string;
  userId?: string; // link to User if patient has account
  fullName: string;
  idNumber?: string; // National ID / Teudat Zehut
  dateOfBirth: Timestamp;
  gender: 'male' | 'female' | 'other';
  phoneNumber: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
  emergencyContact?: EmergencyContact;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatePatientInput {
  userId?: string;
  fullName: string;
  idNumber?: string;
  dateOfBirth: Date | Timestamp;
  gender: 'male' | 'female' | 'other';
  phoneNumber?: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
  emergencyContact?: EmergencyContact;
}

export interface UpdatePatientInput {
  fullName?: string;
  idNumber?: string;
  dateOfBirth?: Date | Timestamp;
  gender?: 'male' | 'female' | 'other';
  phoneNumber?: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
  emergencyContact?: EmergencyContact;
}
