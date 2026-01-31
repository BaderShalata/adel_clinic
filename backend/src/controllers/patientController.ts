import { Request, Response } from 'express';
import { patientService } from '../services/patientService';
import { UpdatePatientInput } from '../models/Patient';
import { AuthRequest } from '../middleware/auth';

export class PatientController {
  async createPatient(req: AuthRequest, res: Response) {
    try {
      const data = req.body;

      if (data.userId !== req.user!.uid) {
        res.status(403).json({ error: 'Cannot create patient for another user' });
        return;
      }

      const patient = await patientService.createPatient(data);
      res.status(201).json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }


  async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const patient = await patientService.getPatientById(id as string);
      if (!patient) {
        res.status(404).json({ error: 'Patient not found' });
        return;
      }
      res.status(200).json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllPatients(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const patients = await patientService.getAllPatients(search as string);
      res.status(200).json(patients);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updatePatient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdatePatientInput = req.body;
      const patient = await patientService.updatePatient(id as string, data);
      res.status(200).json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deletePatient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await patientService.deletePatient(id as string);
      res.status(200).json({ message: 'Patient deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPatientStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await patientService.getPatientStats();
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const patientController = new PatientController();
