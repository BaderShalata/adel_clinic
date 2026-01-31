"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsService = exports.NewsService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class NewsService {
    constructor() {
        this.newsCollection = db.collection('news');
    }
    async createNews(data, authorUid, authorName) {
        try {
            const newsData = {
                title: data.title,
                content: data.content,
                author: authorUid,
                authorName,
                imageURL: data.imageURL,
                category: data.category,
                isPublished: data.isPublished || false,
                publishedAt: data.isPublished ? admin.firestore.Timestamp.now() : undefined,
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
            };
            const docRef = await this.newsCollection.add(newsData);
            return {
                id: docRef.id,
                ...newsData,
            };
        }
        catch (error) {
            throw new Error(`Failed to create news: ${error.message}`);
        }
    }
    async getNewsById(id) {
        try {
            const doc = await this.newsCollection.doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get news: ${error.message}`);
        }
    }
    async getAllNews(filters) {
        try {
            let query = this.newsCollection.orderBy('createdAt', 'desc');
            if (filters?.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters?.isPublished !== undefined) {
                query = query.where('isPublished', '==', filters.isPublished);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            throw new Error(`Failed to get news: ${error.message}`);
        }
    }
    async updateNews(id, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: admin.firestore.Timestamp.now(),
            };
            // Set publishedAt if changing from unpublished to published
            if (data.isPublished === true) {
                const existingNews = await this.getNewsById(id);
                if (existingNews && !existingNews.isPublished) {
                    updateData.publishedAt = admin.firestore.Timestamp.now();
                }
            }
            await this.newsCollection.doc(id).update(updateData);
            const updatedNews = await this.getNewsById(id);
            if (!updatedNews) {
                throw new Error('News not found after update');
            }
            return updatedNews;
        }
        catch (error) {
            throw new Error(`Failed to update news: ${error.message}`);
        }
    }
    async deleteNews(id) {
        try {
            await this.newsCollection.doc(id).delete();
        }
        catch (error) {
            throw new Error(`Failed to delete news: ${error.message}`);
        }
    }
    async getPublishedNews(category, limit = 10) {
        try {
            // Simple query that doesn't require composite index
            const snapshot = await this.newsCollection
                .where('isPublished', '==', true)
                .limit(limit)
                .get();
            let results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Filter by category if specified
            if (category) {
                results = results.filter(news => news.category === category);
            }
            // Sort by publishedAt descending in memory
            results.sort((a, b) => {
                const aTime = a.publishedAt?.toMillis?.() || 0;
                const bTime = b.publishedAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
            return results;
        }
        catch (error) {
            throw new Error(`Failed to get published news: ${error.message}`);
        }
    }
}
exports.NewsService = NewsService;
exports.newsService = new NewsService();
//# sourceMappingURL=newsService.js.map