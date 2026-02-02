import { Request, Response } from 'express';
import { waitingListService } from '../services/waitingListService';
import { CreateWaitingListInput, UpdateWaitingListInput } from '../models/WaitingList';
import { AuthRequest } from '../middleware/auth';

export class WaitingListController {
  /**
   * Add a patient to the waiting list
   * POST /api/waiting-list
   */
  async addToWaitingList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: CreateWaitingListInput = {
        patientId: req.body.patientId,
        doctorId: req.body.doctorId,
        serviceType: req.body.serviceType,
        preferredDate: new Date(req.body.preferredDate),
        priority: req.body.priority,
        notes: req.body.notes,
      };

      const createdBy = req.user?.uid || 'system';
      const entry = await waitingListService.addToWaitingList(data, createdBy);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all waiting list entries with optional filters
   * GET /api/waiting-list
   * Query params: doctorId, patientId, status, date (YYYY-MM-DD)
   */
  async getWaitingList(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId, patientId, status, date } = req.query;

      const filters: any = {};
      if (doctorId) filters.doctorId = doctorId as string;
      if (patientId) filters.patientId = patientId as string;
      if (status) filters.status = status as string;
      if (date) filters.date = new Date(date as string);

      const entries = await waitingListService.getWaitingList(filters);
      res.status(200).json(entries);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get a specific waiting list entry
   * GET /api/waiting-list/:id
   */
  async getWaitingListEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const entry = await waitingListService.getWaitingListById(id as string);

      if (!entry) {
        res.status(404).json({ error: 'Waiting list entry not found' });
        return;
      }

      res.status(200).json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update a waiting list entry
   * PUT /api/waiting-list/:id
   */
  async updateWaitingListEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateWaitingListInput = {};

      if (req.body.preferredDate) {
        data.preferredDate = new Date(req.body.preferredDate);
      }
      if (req.body.status) data.status = req.body.status;
      if (req.body.priority !== undefined) data.priority = req.body.priority;
      if (req.body.notes !== undefined) data.notes = req.body.notes;

      const entry = await waitingListService.updateWaitingListEntry(id as string, data);
      res.status(200).json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Remove from waiting list
   * DELETE /api/waiting-list/:id
   */
  async removeFromWaitingList(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await waitingListService.removeFromWaitingList(id as string);
      res.status(200).json({ message: 'Removed from waiting list' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Book an appointment from waiting list entry
   * POST /api/waiting-list/:id/book
   * Body: { appointmentDate: "YYYY-MM-DD", appointmentTime: "HH:MM" }
   */
  async bookFromWaitingList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { appointmentDate, appointmentTime } = req.body;

      if (!appointmentTime) {
        res.status(400).json({ error: 'appointmentTime is required' });
        return;
      }

      if (!appointmentDate) {
        res.status(400).json({ error: 'appointmentDate is required' });
        return;
      }

      const createdBy = req.user?.uid || 'system';
      const appointment = await waitingListService.bookFromWaitingList(
        id as string,
        new Date(appointmentDate),
        appointmentTime,
        createdBy
      );
      res.status(201).json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const waitingListController = new WaitingListController();
