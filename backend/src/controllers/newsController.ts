import { Request, Response } from 'express';
import { newsService } from '../services/newsService';
import { CreateNewsInput, UpdateNewsInput } from '../models/News';

export class NewsController {
  async createNews(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateNewsInput = req.body;
      const authorUid = (req as any).user?.uid || '';
      const authorName = (req as any).user?.name || 'Admin';
      const news = await newsService.createNews(data, authorUid, authorName);
      res.status(201).json(news);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getNewsById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const news = await newsService.getNewsById(id as string);
      if (!news) {
        res.status(404).json({ error: 'News not found' });
        return;
      }
      res.status(200).json(news);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllNews(req: Request, res: Response): Promise<void> {
    try {
      const { category, isPublished } = req.query;

      const filters: any = {};
      if (category) filters.category = category;
      if (isPublished !== undefined) filters.isPublished = isPublished === 'true';

      const news = await newsService.getAllNews(filters);
      res.status(200).json(news);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateNews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateNewsInput = req.body;
      const news = await newsService.updateNews(id as string, data);
      res.status(200).json(news);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteNews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await newsService.deleteNews(id as string);
      res.status(200).json({ message: 'News deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPublishedNews(req: Request, res: Response): Promise<void> {
    try {
      const { category, limit } = req.query;
      const news = await newsService.getPublishedNews(
        category as string,
        limit ? parseInt(limit as string) : 10
      );
      res.status(200).json(news);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const newsController = new NewsController();
