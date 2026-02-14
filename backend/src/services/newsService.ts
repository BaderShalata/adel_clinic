import * as admin from 'firebase-admin';
import { News, CreateNewsInput, UpdateNewsInput } from '../models/News';

const db = admin.firestore();

export class NewsService {
  private newsCollection = db.collection('news');

  async createNews(data: CreateNewsInput, authorUid: string, authorName: string): Promise<News> {
    try {
      const newsData: any = {
        title: data.title,
        content: data.content,
        author: authorUid,
        authorName,
        category: data.category,
        isPublished: data.isPublished || false,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      // Only add imageURL if it has a value (Firestore doesn't accept undefined)
      if (data.imageURL) {
        newsData.imageURL = data.imageURL;
      }

      // Only add publishedAt if publishing
      if (data.isPublished) {
        newsData.publishedAt = admin.firestore.Timestamp.now();
      }

      const docRef = await this.newsCollection.add(newsData);

      return {
        id: docRef.id,
        ...newsData,
      };
    } catch (error: any) {
      throw new Error(`Failed to create news: ${error.message}`);
    }
  }

  async getNewsById(id: string): Promise<News | null> {
    try {
      const doc = await this.newsCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as News;
    } catch (error: any) {
      throw new Error(`Failed to get news: ${error.message}`);
    }
  }

  async getAllNews(filters?: {
    category?: string;
    isPublished?: boolean;
  }): Promise<News[]> {
    try {
      let query: FirebaseFirestore.Query = this.newsCollection.orderBy('createdAt', 'desc');

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
      } as News));
    } catch (error: any) {
      throw new Error(`Failed to get news: ${error.message}`);
    }
  }

  async updateNews(id: string, data: UpdateNewsInput): Promise<News> {
    try {
      // Build update data, excluding undefined values
      const updateData: any = {
        updatedAt: admin.firestore.Timestamp.now(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.imageURL !== undefined) updateData.imageURL = data.imageURL;
      if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

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
    } catch (error: any) {
      throw new Error(`Failed to update news: ${error.message}`);
    }
  }

  async deleteNews(id: string): Promise<void> {
    try {
      await this.newsCollection.doc(id).delete();
    } catch (error: any) {
      throw new Error(`Failed to delete news: ${error.message}`);
    }
  }

  async getPublishedNews(category?: string, limit: number = 10): Promise<News[]> {
    try {
      // Simple query that doesn't require composite index
      const snapshot = await this.newsCollection
        .where('isPublished', '==', true)
        .limit(limit)
        .get();

      let results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as News));

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
    } catch (error: any) {
      throw new Error(`Failed to get published news: ${error.message}`);
    }
  }
}

export const newsService = new NewsService();
