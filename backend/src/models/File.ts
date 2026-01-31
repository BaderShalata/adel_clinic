import { Timestamp } from 'firebase-admin/firestore';

export interface FileDocument {
  id: string;
  fileName: string;
  fileURL: string;
  fileType: string; // mime type
  fileSize: number; // bytes
  uploadedBy: string; // uid
  patientId?: string; // if medical record
  category: 'medical-record' | 'lab-result' | 'prescription' | 'other';
  description?: string;
  uploadedAt: Timestamp;
}

export interface CreateFileInput {
  fileName: string;
  fileURL: string;
  fileType: string;
  fileSize: number;
  patientId?: string;
  category: 'medical-record' | 'lab-result' | 'prescription' | 'other';
  description?: string;
}

export interface UpdateFileInput {
  description?: string;
  category?: 'medical-record' | 'lab-result' | 'prescription' | 'other';
}
