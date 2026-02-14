import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Use the specific Firebase Storage bucket
const bucket = admin.storage().bucket('adelclinic-35393.firebasestorage.app');

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

export class UploadService {
  /**
   * Upload a file from base64 data to Firebase Storage
   * @param base64Data Base64 encoded file data (without the data:... prefix)
   * @param fileName Original file name
   * @param folder Folder to store the file in (e.g., 'news', 'doctors')
   * @param mimeType MIME type of the file
   */
  async uploadBase64(
    base64Data: string,
    fileName: string,
    folder: string,
    mimeType: string
  ): Promise<UploadResult> {
    try {
      // Generate unique file name
      const extension = this.getExtensionFromMimeType(mimeType) || fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${uuidv4()}.${extension}`;
      const filePath = `${folder}/${uniqueFileName}`;

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Create file reference
      const file = bucket.file(filePath);

      // Upload the file
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        },
      });

      // Make the file publicly accessible
      await file.makePublic();

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      return {
        url: publicUrl,
        path: filePath,
        fileName: uniqueFileName,
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete a file from Firebase Storage
   * @param filePath Path to the file in storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await bucket.file(filePath).delete();
    } catch (error: any) {
      // Ignore "not found" errors
      if (error.code !== 404) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    }
  }

  private getExtensionFromMimeType(mimeType: string): string | null {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    return mimeToExt[mimeType] || null;
  }
}

export const uploadService = new UploadService();
