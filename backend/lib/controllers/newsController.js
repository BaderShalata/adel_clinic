"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsController = exports.NewsController = void 0;
const newsService_1 = require("../services/newsService");
class NewsController {
    async createNews(req, res) {
        try {
            const data = req.body;
            const authorUid = req.user?.uid || '';
            const authorName = req.user?.name || 'Admin';
            const news = await newsService_1.newsService.createNews(data, authorUid, authorName);
            res.status(201).json(news);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getNewsById(req, res) {
        try {
            const { id } = req.params;
            const news = await newsService_1.newsService.getNewsById(id);
            if (!news) {
                res.status(404).json({ error: 'News not found' });
                return;
            }
            res.status(200).json(news);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAllNews(req, res) {
        try {
            const { category, isPublished } = req.query;
            const filters = {};
            if (category)
                filters.category = category;
            if (isPublished !== undefined)
                filters.isPublished = isPublished === 'true';
            const news = await newsService_1.newsService.getAllNews(filters);
            res.status(200).json(news);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateNews(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const news = await newsService_1.newsService.updateNews(id, data);
            res.status(200).json(news);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deleteNews(req, res) {
        try {
            const { id } = req.params;
            await newsService_1.newsService.deleteNews(id);
            res.status(200).json({ message: 'News deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getPublishedNews(req, res) {
        try {
            const { category, limit } = req.query;
            const news = await newsService_1.newsService.getPublishedNews(category, limit ? parseInt(limit) : 10);
            res.status(200).json(news);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.NewsController = NewsController;
exports.newsController = new NewsController();
//# sourceMappingURL=newsController.js.map