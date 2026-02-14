import { Timestamp } from 'firebase-admin/firestore';

export interface DoctorSchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDuration: number; // minutes
  type?: string; // e.g., "Pediatrician", "Geneticist", "Consultation"
}

export interface Doctor {
  id: string;
  userId: string; // link to User

  // Multilingual support
  fullName: string;        // Arabic (primary)
  fullNameEn?: string;     // English
  fullNameHe?: string;     // Hebrew

  specialties: string[];      // Arabic (primary) - Changed to array
  specialtiesEn?: string[];   // English
  specialtiesHe?: string[];   // Hebrew

  qualifications: string[];   // Arabic (primary)
  qualificationsEn?: string[]; // English
  qualificationsHe?: string[]; // Hebrew

  bio?: string;               // Doctor bio/snippet (Arabic)
  bioEn?: string;             // English
  bioHe?: string;             // Hebrew

  imageUrl?: string;          // Doctor profile photo URL
  schedule: DoctorSchedule[];
  isActive: boolean;
  createdAt: Timestamp;
}

export interface CreateDoctorInput {
  userId: string;
  fullName: string;
  fullNameEn?: string;
  fullNameHe?: string;
  specialties: string[];
  specialtiesEn?: string[];
  specialtiesHe?: string[];
  qualifications: string[];
  qualificationsEn?: string[];
  qualificationsHe?: string[];
  bio?: string;
  bioEn?: string;
  bioHe?: string;
  imageUrl?: string;
  schedule: DoctorSchedule[];
}

export interface UpdateDoctorInput {
  fullName?: string;
  fullNameEn?: string;
  fullNameHe?: string;
  specialties?: string[];
  specialtiesEn?: string[];
  specialtiesHe?: string[];
  qualifications?: string[];
  qualificationsEn?: string[];
  qualificationsHe?: string[];
  bio?: string;
  bioEn?: string;
  bioHe?: string;
  imageUrl?: string;
  schedule?: DoctorSchedule[];
  isActive?: boolean;
}
