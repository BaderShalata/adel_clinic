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
exports.authController = exports.AuthController = void 0;
const admin = __importStar(require("firebase-admin"));
const authService_1 = require("../services/authService");
class AuthController {
    /**
     * Register a new user
     * POST /api/auth/register
     * Expects Firebase ID token in Authorization header
     */
    async register(req, res) {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: 'No authorization token provided' });
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            // Verify the Firebase token
            const decodedToken = await authService_1.authService.verifyToken(idToken);
            const uid = decodedToken.uid;
            // Get registration data from request body
            const data = {
                email: req.body.email || decodedToken.email || '',
                displayName: req.body.displayName || decodedToken.name || 'Unknown',
                phoneNumber: req.body.phoneNumber,
                idNumber: req.body.idNumber,
                role: req.body.role || 'patient',
            };
            // Register the user and create patient record
            const user = await authService_1.authService.registerUser(uid, data);
            // Debug log
            console.log('✅ User registered successfully:', uid);
            // Return user data in format expected by mobile app
            res.status(201).json({
                id: user.uid,
                email: user.email,
                displayName: user.fullName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                message: 'Registration successful',
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            console.error('Full error stack:', error.stack);
            res.status(400).json({
                error: error.message,
                details: error.toString(),
            });
        }
    }
    /**
     * Login - verify token and return user data
     * POST /api/auth/login
     * Expects Firebase ID token in Authorization header
     */
    async login(req, res) {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: 'No authorization token provided' });
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            // Verify the Firebase token
            const decodedToken = await authService_1.authService.verifyToken(idToken);
            const uid = decodedToken.uid;
            // Get user data
            let user = await authService_1.authService.getUserByUid(uid);
            if (!user) {
                // User doesn't exist in Firestore, create them
                user = await authService_1.authService.registerUser(uid, {
                    email: decodedToken.email || '',
                    displayName: decodedToken.name || 'Unknown',
                });
            }
            // Return user data in format expected by mobile app
            res.status(200).json({
                id: user.uid,
                email: user.email,
                displayName: user.fullName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                patientId: user.patientId,
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Get current user profile
     * GET /api/auth/me
     * Expects Firebase ID token in Authorization header
     */
    async getMe(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: 'No authorization token provided' });
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await authService_1.authService.verifyToken(idToken);
            const uid = decodedToken.uid;
            const user = await authService_1.authService.getUserByUid(uid);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.status(200).json({
                id: user.uid,
                email: user.email,
                displayName: user.fullName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                patientId: user.patientId,
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Set admin claims for web admin users
     * POST /api/auth/set-admin-claims
     * Called after signup to set the admin role in Firebase Auth custom claims
     */
    async setAdminClaims(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: 'No authorization token provided' });
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await authService_1.authService.verifyToken(idToken);
            const uid = decodedToken.uid;
            // Check if user exists in Firestore with admin role
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) {
                res.status(404).json({ error: 'User not found in database' });
                return;
            }
            const userData = userDoc.data();
            if (userData?.role !== 'admin') {
                res.status(403).json({ error: 'User is not an admin' });
                return;
            }
            // Set the admin custom claim
            await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
            console.log('✅ Admin claims set for user:', uid);
            res.status(200).json({
                message: 'Admin claims set successfully',
                note: 'Please refresh your token by logging out and back in'
            });
        }
        catch (error) {
            console.error('Set admin claims error:', error);
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=authController.js.map