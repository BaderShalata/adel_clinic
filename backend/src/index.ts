import { onRequest } from 'firebase-functions/v2/https';
const functions: any = require('firebase-functions');
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import express from 'express';
import rateLimit from 'express-rate-limit';

// ----- Adel Clinic API Backend -----
// ----- Global Options -----
setGlobalOptions({ maxInstances: 10 });

// ----- Initialize Firebase -----
admin.initializeApp();

// ----- Create Express App -----
const app = express();

// ----- CORS Middleware (MUST come first to handle all responses) -----
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  next();
});

// ----- JSON Middleware -----
app.use(express.json());

// ----- Rate Limiting -----
// General limiter: 500 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use Authorization header (Firebase UID) if present, otherwise use IP
    const authHeader = req.headers.authorization;
    if (authHeader) {
      return authHeader; // Rate limit per user token
    }
    return req.ip || 'unknown';
  },
});

// ----- Apply Rate Limiting -----
app.use(generalLimiter);

// ----- Import Routes -----
import appointmentRoutes from './routes/appointmentRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import patientRoutes from './routes/patientRoutes';
import newsRoutes from './routes/newsRoutes';
import doctorRoutes from './routes/doctorRoutes';
import fileRoutes from './routes/fileRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import waitingListRoutes from './routes/waitingListRoutes';

// ----- Prefix Routes -----
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/waiting-list', waitingListRoutes);

// ----- Health Check -----
app.get('/', (_req, res) => res.json({ status: 'ok', message: 'Adel Clinic API is running' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', message: 'Adel Clinic API is running' }));

// ----- Global Error Handler -----
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ----- Export Cloud Function -----
export const api = onRequest(app);

// ----- Auth trigger: create patient document for mobile sign-ups -----
// Register auth onCreate trigger only when the imported firebase-functions exposes it.
// Some firebase-functions versions or packaging may not expose `auth` on the default import,
// which would cause a runtime crash during analysis. Detect safely and skip registration if unavailable.
try {
  const authBuilder = (functions.auth && functions.auth.user)
    ? functions.auth.user()
    : (functions.default && functions.default.auth && functions.default.auth.user)
      ? functions.default.auth.user()
      : null;

  if (authBuilder) {
    exports.authOnCreate = authBuilder.onCreate(async (user: admin.auth.UserRecord) => {
      try {
        const db = admin.firestore();
        const patientsCollection = db.collection('patients');

        // If the user already has an admin role claim, skip creating a patient doc
        const claims: any = (user.customClaims || {});
        if (claims.role && String(claims.role).toLowerCase().includes('admin')) {
          return;
        }

        const patientData = {
          email: user.email || null,
          fullName: user.displayName || null,
          phoneNumber: user.phoneNumber || null,
          role: 'patient',
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
          isActive: true,
        };

        await patientsCollection.doc(user.uid).set(patientData);
      } catch (err) {
        console.error('authOnCreate error:', err);
        throw err;
      }
    });
  } else {
    console.warn('firebase-functions auth trigger not available; authOnCreate not registered.');
  }
} catch (e) {
  console.warn('Error while registering authOnCreate trigger:', e);
}
