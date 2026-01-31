import { Request, Response } from 'express';
import { appointmentService } from '../services/appointmentService';
import { CreateAppointmentInput, UpdateAppointmentInput } from '../models/Appointment';

export class AppointmentController {
  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateAppointmentInput = req.body;
      const createdBy = (req as any).user?.uid || '';
      const appointment = await appointmentService.createAppointment(data, createdBy);
      res.status(201).json(appointment);
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
