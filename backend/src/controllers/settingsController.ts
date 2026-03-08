import { Request, Response } from 'express';
import { settingsService } from '../services/settingsService';

export class SettingsController {
  async getClinicStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await settingsService.getClinicStatus();
      res.status(200).json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async setClinicLock(req: Request, res: Response): Promise<void> {
    try {
      const { isLocked, reason } = req.body;
      const adminUid = (req as any).user?.uid || '';
      const status = await settingsService.setClinicLock(isLocked, adminUid, reason);
      res.status(200).json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const settingsController = new SettingsController();
