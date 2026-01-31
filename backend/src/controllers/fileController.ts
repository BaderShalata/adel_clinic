import { Request, Response } from 'express';
import { fileService } from '../services/fileService';
import { CreateFileInput, UpdateFileInput } from '../models/File';

export class FileController {
  async createFile(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateFileInput = req.body;
      const uploadedBy = (req as any).user?.uid || '';
      const file = await fileService.createFile(data, uploadedBy);
      res.status(201).json(file);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getFileById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = await fileService.getFileById(id as string);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      res.status(200).json(file);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllFiles(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, category } = req.query;

      const filters: any = {};
      if (patientId) filters.patientId = patientId;
      if (category) filters.category = category;

      const files = await fileService.getAllFiles(filters);
      res.status(200).json(files);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateFile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateFileInput = req.body;
      const file = await fileService.updateFile(id as string, data);
      res.status(200).json(file);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await fileService.deleteFile(id as string);
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getFilesByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const files = await fileService.getFilesByPatient(patientId as string);
      res.status(200).json(files);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const fileController = new FileController();
