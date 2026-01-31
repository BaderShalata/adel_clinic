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
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
// ----- Adel Clinic API Backend -----
// ----- Global Options -----
(0, v2_1.setGlobalOptions)({ maxInstances: 10 });
// ----- Initialize Firebase -----
admin.initializeApp();
// ----- Create Express App -----
const app = (0, express_1.default)();
// ----- Handle Preflight Requests FIRST -----
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});
// ----- CORS Headers for All Requests -----
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
// ----- JSON Middleware -----
app.use(express_1.default.json());
// ----- Import Routes -----
const appointmentRoutes_1 = __importDefault(require("./routes/appointmentRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const patientRoutes_1 = __importDefault(require("./routes/patientRoutes"));
const newsRoutes_1 = __importDefault(require("./routes/newsRoutes"));
const doctorRoutes_1 = __importDefault(require("./routes/doctorRoutes"));
const fileRoutes_1 = __importDefault(require("./routes/fileRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
// ----- Prefix Routes -----
app.use('/api/appointments', appointmentRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/patients', patientRoutes_1.default);
app.use('/api/news', newsRoutes_1.default);
app.use('/api/doctors', doctorRoutes_1.default);
app.use('/api/files', fileRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
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
//# sourceMappingURL=index.js.map