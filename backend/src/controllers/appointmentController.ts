import { Request, Response } from 'express';
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
   * Uses atomic transaction to create patient (if needed) and appointment together
   */
  async bookAppointment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;
      const userEmail = req.user?.email || '';
      const userName = req.user?.name || 'Patient';

      if (!uid) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { doctorId, appointmentDate, appointmentTime, serviceType, duration, notes } = req.body;

      if (!doctorId || !appointmentDate || !appointmentTime || !serviceType) {
        res.status(400).json({ error: 'Missing required fields: doctorId, appointmentDate, appointmentTime, serviceType' });
        return;
      }

      // Use atomic booking method that handles patient creation + appointment in one transaction
      const data: CreateAppointmentInput = {
        patientId: uid,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        serviceType,
        duration: duration || 15,
        notes,
      };

      const appointment = await appointmentService.bookAppointmentAtomic(data, uid, userEmail, userName);
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

  /**
   * Patient cancels their own appointment
   * PUT /api/appointments/my/:id/cancel
   */
  async cancelMyAppointment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;

      if (!uid) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get the appointment to verify ownership
      const appointment = await appointmentService.getAppointmentById(id as string);
      if (!appointment) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      // Verify the appointment belongs to this patient
      if (appointment.patientId !== uid) {
        res.status(403).json({ error: 'You can only cancel your own appointments' });
        return;
      }

      // Check if appointment can be cancelled (only scheduled/confirmed/pending)
      const cancellableStatuses = ['scheduled', 'confirmed', 'pending'];
      if (!cancellableStatuses.includes(appointment.status)) {
        res.status(400).json({ error: `Cannot cancel appointment with status: ${appointment.status}` });
        return;
      }

      // Update status to cancelled
      const updatedAppointment = await appointmentService.updateAppointment(id as string, {
        status: 'cancelled',
      });

      res.status(200).json(updatedAppointment);
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
      if (status) filters.status = status as string;
      if (doctorId) filters.doctorId = doctorId as string;
      if (patientId) filters.patientId = patientId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) {
        // Set endDate to end of day (23:59:59.999) to include all appointments on that day
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999);
        filters.endDate = endDateObj;
      }

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

  /**
   * Delete a user's own past/cancelled appointment
   * DELETE /api/appointments/my/:id
   */
  async deleteMyAppointment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;

      if (!uid) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const appointmentId = id as string;

      // Get the appointment to verify ownership
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      if (!appointment) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      // Verify the appointment belongs to this user
      if (appointment.patientId !== uid && appointment.createdBy !== uid) {
        res.status(403).json({ error: 'You can only delete your own appointments' });
        return;
      }

      // Only allow deleting past, cancelled, or completed appointments
      const validStatuses = ['cancelled', 'completed', 'no_show'];
      const appointmentDate = appointment.appointmentDate instanceof Date
        ? appointment.appointmentDate
        : (appointment.appointmentDate as any).toDate();
      const isPast = appointmentDate < new Date();

      if (!validStatuses.includes(appointment.status) && !isPast) {
        res.status(400).json({ error: 'You can only delete past, cancelled, or completed appointments' });
        return;
      }

      await appointmentService.deleteAppointment(appointmentId);
      res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Clear all past/cancelled appointments for the current user
   * DELETE /api/appointments/my/clear-history
   */
  async clearMyHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;

      if (!uid) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get all user's appointments
      const appointments = await appointmentService.getAllAppointments({ patientId: uid });

      // Filter for deletable appointments (past, cancelled, completed)
      const now = new Date();
      const toDelete = appointments.filter(apt => {
        const appointmentDate = apt.appointmentDate instanceof Date
          ? apt.appointmentDate
          : (apt.appointmentDate as any).toDate();
        const isPast = appointmentDate < now;
        const isDeletableStatus = ['cancelled', 'completed', 'no_show'].includes(apt.status);
        return isPast || isDeletableStatus;
      });

      // Delete each appointment
      let deletedCount = 0;
      for (const apt of toDelete) {
        try {
          await appointmentService.deleteAppointment(apt.id);
          deletedCount++;
        } catch (e) {
          console.error(`Failed to delete appointment ${apt.id}:`, e);
        }
      }

      res.status(200).json({
        message: `Cleared ${deletedCount} appointments from history`,
        deletedCount
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const appointmentController = new AppointmentController();
