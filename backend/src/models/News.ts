import { Timestamp } from 'firebase-admin/firestore';

export interface News {
  id: string;
  title: string;
  content: string;
  author: string; // admin uid
  authorName: string;
  imageURL?: string;
  category: 'announcement' | 'health-tip' | 'event' | 'general';
  isPublished: boolean;
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateNewsInput {
  title: string;
  content: string;
  imageURL?: string;
  category: 'announcement' | 'health-tip' | 'event' | 'general';
  isPublished?: boolean;
}

export interface UpdateNewsInput {
  title?: string;
  content?: string;
  imageURL?: string;
  category?: 'announcement' | 'health-tip' | 'event' | 'general';
  isPublished?: boolean;
}
