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
exports.authService = exports.AuthService = void 0;
const admin = __importStar(require("firebase-admin"));
const patientService_1 = require("./patientService");
const db = admin.firestore();
const auth = admin.auth();
class AuthService {
    constructor() {
        this.usersCollection = db.collection('users');
    }
    /**
     * Register a new user and create a patient record
     * Called after Firebase Auth user is already created from mobile
     */
    async registerUser(uid, data) {
        try {
            // Check if user already exists in Firestore
            const existingUser = await this.usersCollection.doc(uid).get();
            if (existingUser.exists) {
                // User already registered, return existing data
                const userData = existingUser.data();
                // Ensure we don't duplicate uid when spreading
                const { uid: _maybeUid, ...userDataNoUid } = userData;
                const patient = await patientService_1.patientService.getPatientByUserId(uid);
                return {
                    uid,
                    ...userDataNoUid,
                    patientId: patient?.id,
                };
            }
            const role = data.role || 'patient';
            // Set custom claims for role
            await auth.setCustomUserClaims(uid, { role });
            // Create Firestore user document - avoid undefined values
            const userData = {
                email: data.email,
                fullName: data.displayName,
                role,
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
                isActive: true,
            };
            // Only add optional fields if they have values
            if (data.phoneNumber) {
                userData.phoneNumber = data.phoneNumber;
            }
            await this.usersCollection.doc(uid).set(userData);
            let patientId;
            // If role is patient, also create a patient record
            if (role === 'patient') {
                const patient = await patientService_1.patientService.createPatient({
                    userId: uid,
                    fullName: data.displayName,
                    dateOfBirth: new Date(2000, 0, 1), // Default date, can be updated later
                    gender: data.gender || 'other',
                    phoneNumber: data.phoneNumber || '',
                    email: data.email,
                    idNumber: data.idNumber,
                });
                patientId = patient.id;
            }
            return {
                uid,
                ...userData,
                patientId,
            };
        }
        catch (error) {
            throw new Error(`Failed to register user: ${error.message}`);
        }
    }
    /**
     * Get user by UID, creating user record if needed
     */
    async getUserByUid(uid) {
        try {
            const doc = await this.usersCollection.doc(uid).get();
            if (!doc.exists) {
                // User exists in Firebase Auth but not in Firestore
                // This shouldn't happen normally, but handle it gracefully
                const firebaseUser = await auth.getUser(uid);
                if (firebaseUser) {
                    // Auto-create user record
                    return await this.registerUser(uid, {
                        email: firebaseUser.email || '',
                        displayName: firebaseUser.displayName || 'Unknown',
                        phoneNumber: firebaseUser.phoneNumber,
                    });
                }
                return null;
            }
            const userData = doc.data();
            // Get patient record if exists
            let patientId;
            if (userData.role === 'patient') {
                const patient = await patientService_1.patientService.getPatientByUserId(uid);
                patientId = patient?.id;
            }
            // Avoid duplicating uid if userData already contains it
            const { uid: _maybeUid2, ...userDataNoUid2 } = userData;
            return {
                uid: doc.id,
                ...userDataNoUid2,
                patientId,
            };
        }
        catch (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }
    /**
     * Verify Firebase ID token and return decoded token
     */
    async verifyToken(idToken) {
        try {
            return await auth.verifyIdToken(idToken);
        }
        catch (error) {
            throw new Error(`Invalid token: ${error.message}`);
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=authService.js.map