import { Response } from 'express';
import { uploadService } from '../services/uploadService';
import { AuthRequest } from '../middleware/auth';

export class UploadController {
  /**
   * Upload an image to Firebase Storage
   * POST /api/upload/image
   * Body: { image: base64String, fileName: string, folder: string, mimeType: string }
   */
  async uploadImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { image, fileName, folder, mimeType } = req.body;

      if (!image) {
        res.status(400).json({ error: 'Image data is required' });
        return;
      }

      // Remove data URL prefix if present (e.g., "data:image/png;base64,")
      let base64Data = image;
      if (image.includes(',')) {
        base64Data = image.split(',')[1];
      }

      const result = await uploadService.uploadBase64(
        base64Data,
        fileName || 'image.jpg',
        folder || 'uploads',
        mimeType || 'image/jpeg'
      );

      res.status(200).json({
        success: true,
        url: result.url,
        path: result.path,
        fileName: result.fileName,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
  }

  /**
   * Delete an image from Firebase Storage
   * DELETE /api/upload/image
   * Body: { path: string } - the file path returned from upload
   */
  async deleteImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { path } = req.body;

      if (!path) {
        res.status(400).json({ error: 'File path is required' });
        return;
      }

      await uploadService.deleteFile(path);

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete image' });
    }
  }
}

export const uploadController = new UploadController();
