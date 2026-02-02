import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { appointmentService } from '../services/appointmentService';
import { CreateAppointmentInput, UpdateAppointmentInput } from '../models/Appointment';
import { AuthRequest } from '../middleware/auth';

export class AppointmentController {
  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateAppointmentInput = req.body;
      const createdBy = (req as any).user?.uid || '';
      const role = (req as any).user?.role || 'user';
      const appointment = await appointmentService.createAppointment(data, createdBy, role);
      res.status(201).json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Patient booking endpoint - allows patients to book their own appointments
   * POST /api/appointments/book
   */
  async bookAppointment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;
      const userEmail = req.user?.email;
      const userName = req.user?.name;

      if (!uid) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { doctorId, appointmentDate, appointmentTime, serviceType, duration, notes } = req.body;

      if (!doctorId || !appointmentDate || !appointmentTime || !serviceType) {
        res.status(400).json({ error: 'Missing required fields: doctorId, appointmentDate, appointmentTime, serviceType' });
        return;
      }

      // Ensure patient exists - create if not
      const db = admin.firestore();
      const patientDoc = await db.collection('patients').doc(uid).get();

      if (!patientDoc.exists) {
        // Create patient document for this user
        await db.collection('patients').doc(uid).set({
          userId: uid,
          email: userEmail || '',
          fullName: userName || 'Patient',
          role: 'patient',
          isActive: true,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });
        console.log('Created patient document for user:', uid);
      }

      // Patient ID is the user's UID (patients collection uses UID as document ID)
      const data: CreateAppointmentInput = {
        patientId: uid,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        serviceType,
        duration: duration || 15,
        notes,
      };

      const appointment = await appointmentService.createAppointment(data, uid, 'user');
      res.status(201).json(appointment);
    } catch (error: any) {
      console.error('Booking error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get patient's own appointments
   * GET /api/appointments/my
   */
  async getMyAppointments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const appointments = await appointmentService.getAllAppointments({ patientId: uid });
      res.status(200).json(appointments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAppointmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.getAppointmentById(id as string);
      if (!appointment) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }
      res.status(200).json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { status, doctorId, patientId, startDate, endDate } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (doctorId) filters.doctorId = doctorId;
      if (patientId) filters.patientId = patientId;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const appointments = await appointmentService.getAllAppointments(filters);
      res.status(200).json(appointments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateAppointmentInput = req.body;
      const appointment = await appointmentService.updateAppointment(id as string, data);
      res.status(200).json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await appointmentService.deleteAppointment(id as string);
      res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTodayAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.query;
      const appointments = await appointmentService.getTodayAppointments(doctorId as string);
      res.status(200).json(appointments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const appointmentController = new AppointmentController();
