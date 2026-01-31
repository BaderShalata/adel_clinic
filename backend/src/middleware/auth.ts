import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    name?: string;
  };
}

// Authentication middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip authentication for preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
      name: decodedToken.name,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Role-based authorization
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      return;
    }


    const userRole = req.user.role;

    if (!userRole) {
      res.status(403).json({ error: 'Forbidden: Role not assigned' });
      return;
    }


    next();
  };
};

export const authorizeAdmin = authorizeRoles('admin', 'user');
export const authorizeDoctorOrAdmin = authorizeRoles('admin', 'doctor');
