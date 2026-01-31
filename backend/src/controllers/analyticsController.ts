import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await analyticsService.getAnalytics();
      res.status(200).json(analytics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAppointmentTrends(req: Request, res: Response): Promise<void> {
    try {
      const { days } = req.query;
      const trends = await analyticsService.getAppointmentTrends(
        days ? parseInt(days as string) : 30
      );
      res.status(200).json(trends);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const analyticsController = new AnalyticsController();
