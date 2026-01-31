import { Timestamp } from 'firebase-admin/firestore';

export interface User {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: 'admin' | 'doctor' | 'patient';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  photoURL?: string;
  isActive: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role: 'admin' | 'doctor' | 'patient';
}

export interface UpdateUserInput {
  fullName?: string;
  phoneNumber?: string;
  photoURL?: string;
  isActive?: boolean;
}
