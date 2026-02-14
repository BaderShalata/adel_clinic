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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const functions = require('firebase-functions');
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// ----- Adel Clinic API Backend -----
// ----- Global Options -----
(0, v2_1.setGlobalOptions)({ maxInstances: 10 });
// ----- Initialize Firebase -----
admin.initializeApp();
// ----- Create Express App -----
const app = (0, express_1.default)();
// ----- CORS Middleware (MUST come first to handle all responses) -----
app.use((req, res, next) => {
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
app.use(express_1.default.json());
// ----- Rate Limiting -----
// General limiter: 500 requests per 15 minutes per IP
const generalLimiter = (0, express_rate_limit_1.default)({
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
const appointmentRoutes_1 = __importDefault(require("./routes/appointmentRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const patientRoutes_1 = __importDefault(require("./routes/patientRoutes"));
const newsRoutes_1 = __importDefault(require("./routes/newsRoutes"));
const doctorRoutes_1 = __importDefault(require("./routes/doctorRoutes"));
const fileRoutes_1 = __importDefault(require("./routes/fileRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const waitingListRoutes_1 = __importDefault(require("./routes/waitingListRoutes"));
const lockedSlotRoutes_1 = __importDefault(require("./routes/lockedSlotRoutes"));
// ----- Prefix Routes -----
app.use('/api/appointments', appointmentRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/patients', patientRoutes_1.default);
app.use('/api/news', newsRoutes_1.default);
app.use('/api/doctors', doctorRoutes_1.default);
app.use('/api/files', fileRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/waiting-list', waitingListRoutes_1.default);
app.use('/api/locked-slots', lockedSlotRoutes_1.default);
// ----- Health Check -----
app.get('/', (_req, res) => res.json({ status: 'ok', message: 'Adel Clinic API is running' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', message: 'Adel Clinic API is running' }));
// ----- Global Error Handler -----
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});
// ----- Export Cloud Function -----
exports.api = (0, https_1.onRequest)(app);
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
        exports.authOnCreate = authBuilder.onCreate(async (user) => {
            try {
                const db = admin.firestore();
                const patientsCollection = db.collection('patients');
                // If the user already has an admin role claim, skip creating a patient doc
                const claims = (user.customClaims || {});
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
            }
            catch (err) {
                console.error('authOnCreate error:', err);
                throw err;
            }
        });
    }
    else {
        console.warn('firebase-functions auth trigger not available; authOnCreate not registered.');
    }
}
catch (e) {
    console.warn('Error while registering authOnCreate trigger:', e);
}
//# sourceMappingURL=index.js.map