import { Request, Response } from 'express';
import { lockedSlotService } from '../services/lockedSlotService';

export const lockedSlotController = {
  /**
   * Create a new locked slot
   * POST /api/locked-slots
   */
  async createLockedSlot(req: Request, res: Response) {
    try {
      const { doctorId, date, time, reason } = req.body;
      const userId = (req as any).user?.uid || 'system';

      if (!doctorId || !date || !time) {
        return res.status(400).json({ error: 'doctorId, date, and time are required' });
      }

      const lockedSlot = await lockedSlotService.createLockedSlot(
        { doctorId, date, time, reason },
        userId
      );

      return res.status(201).json(lockedSlot);
    } catch (error: any) {
      console.error('Error creating locked slot:', error);
      if (error.message === 'This slot is already locked') {
        return res.status(409).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message || 'Failed to create locked slot' });
    }
  },

  /**
   * Get locked slots for a doctor on a date
   * GET /api/locked-slots/doctor/:doctorId/date/:date
   */
  async getLockedSlotsByDate(req: Request, res: Response) {
    try {
      const doctorId = req.params.doctorId as string;
      const date = req.params.date as string;

      if (!doctorId || !date) {
        return res.status(400).json({ error: 'doctorId and date are required' });
      }

      const lockedSlots = await lockedSlotService.getLockedSlotsByDate(doctorId, new Date(date));
      return res.json(lockedSlots);
    } catch (error: any) {
      console.error('Error getting locked slots:', error);
      return res.status(500).json({ error: error.message || 'Failed to get locked slots' });
    }
  },

  /**
   * Get all locked slots for a doctor
   * GET /api/locked-slots/doctor/:doctorId
   */
  async getLockedSlotsByDoctor(req: Request, res: Response) {
    try {
      const doctorId = req.params.doctorId as string;

      if (!doctorId) {
        return res.status(400).json({ error: 'doctorId is required' });
      }

      const lockedSlots = await lockedSlotService.getLockedSlotsByDoctor(doctorId);
      return res.json(lockedSlots);
    } catch (error: any) {
      console.error('Error getting locked slots:', error);
      return res.status(500).json({ error: error.message || 'Failed to get locked slots' });
    }
  },

  /**
   * Delete a locked slot by ID
   * DELETE /api/locked-slots/:id
   */
  async deleteLockedSlot(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      if (!id) {
        return res.status(400).json({ error: 'Locked slot ID is required' });
      }

      await lockedSlotService.deleteLockedSlot(id);
      return res.json({ message: 'Locked slot deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting locked slot:', error);
      return res.status(500).json({ error: error.message || 'Failed to delete locked slot' });
    }
  },

  /**
   * Delete a locked slot by details (doctorId, date, time)
   * DELETE /api/locked-slots/doctor/:doctorId/date/:date/time/:time
   */
  async deleteLockedSlotByDetails(req: Request, res: Response) {
    try {
      const doctorId = req.params.doctorId as string;
      const date = req.params.date as string;
      const time = req.params.time as string;

      if (!doctorId || !date || !time) {
        return res.status(400).json({ error: 'doctorId, date, and time are required' });
      }

      const deleted = await lockedSlotService.deleteLockedSlotByDetails(doctorId, date, time);

      if (!deleted) {
        return res.status(404).json({ error: 'Locked slot not found' });
      }

      return res.json({ message: 'Locked slot deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting locked slot:', error);
      return res.status(500).json({ error: error.message || 'Failed to delete locked slot' });
    }
  },

  /**
   * Check if a slot is locked
   * GET /api/locked-slots/check?doctorId=...&date=...&time=...
   */
  async checkSlotLocked(req: Request, res: Response) {
    try {
      const doctorId = req.query.doctorId as string;
      const date = req.query.date as string;
      const time = req.query.time as string;

      if (!doctorId || !date || !time) {
        return res.status(400).json({ error: 'doctorId, date, and time are required' });
      }

      const isLocked = await lockedSlotService.isSlotLocked(doctorId, date, time);

      return res.json({ locked: isLocked });
    } catch (error: any) {
      console.error('Error checking locked slot:', error);
      return res.status(500).json({ error: error.message || 'Failed to check locked slot' });
    }
  },
};
