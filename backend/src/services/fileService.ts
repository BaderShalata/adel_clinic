import * as admin from 'firebase-admin';
import { FileDocument, CreateFileInput, UpdateFileInput } from '../models/File';

const db = admin.firestore();

export class FileService {
  private filesCollection = db.collection('files');

  async createFile(data: CreateFileInput, uploadedBy: string): Promise<FileDocument> {
    try {
      const fileData: Omit<FileDocument, 'id'> = {
        fileName: data.fileName,
        fileURL: data.fileURL,
        fileType: data.fileType,
        fileSize: data.fileSize,
        uploadedBy,
        patientId: data.patientId,
        category: data.category,
        description: data.description,
        uploadedAt: admin.firestore.Timestamp.now(),
      };

      const docRef = await this.filesCollection.add(fileData);

      return {
        id: docRef.id,
        ...fileData,
      };
    } catch (error: any) {
      throw new Error(`Failed to create file record: ${error.message}`);
    }
  }

  async getFileById(id: string): Promise<FileDocument | null> {
    try {
      const doc = await this.filesCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as FileDocument;
    } catch (error: any) {
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  async getAllFiles(filters?: {
    patientId?: string;
    category?: string;
  }): Promise<FileDocument[]> {
    try {
      let query: FirebaseFirestore.Query = this.filesCollection.orderBy('uploadedAt', 'desc');

      if (filters?.patientId) {
        query = query.where('patientId', '==', filters.patientId);
      }
      if (filters?.category) {
        query = query.where('category', '==', filters.category);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FileDocument));
    } catch (error: any) {
      throw new Error(`Failed to get files: ${error.message}`);
    }
  }

  async updateFile(id: string, data: UpdateFileInput): Promise<FileDocument> {
    try {
      await this.filesCollection.doc(id).update(data as any);

      const updatedFile = await this.getFileById(id);
      if (!updatedFile) {
        throw new Error('File not found after update');
      }

      return updatedFile;
    } catch (error: any) {
      throw new Error(`Failed to update file: ${error.message}`);
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      // Get file document to get the fileURL for storage deletion
      const fileDoc = await this.getFileById(id);
      if (!fileDoc) {
        throw new Error('File not found');
      }

      // Delete from Firestore
      await this.filesCollection.doc(id).delete();

      // Optionally delete from Firebase Storage if using Storage
      // const bucket = admin.storage().bucket();
      // await bucket.file(fileDoc.fileURL).delete();
    } catch (error: any) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getFilesByPatient(patientId: string): Promise<FileDocument[]> {
    try {
      const snapshot = await this.filesCollection
        .where('patientId', '==', patientId)
        .orderBy('uploadedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FileDocument));
    } catch (error: any) {
      throw new Error(`Failed to get patient files: ${error.message}`);
    }
  }
}

export const fileService = new FileService();
