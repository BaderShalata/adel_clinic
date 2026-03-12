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
exports.userService = exports.UserService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const auth = admin.auth();
class UserService {
    constructor() {
        this.usersCollection = db.collection('users');
    }
    async createUser(data) {
        try {
            // Create Firebase Auth user
            const userRecord = await auth.createUser({
                email: data.email,
                password: data.password,
                displayName: data.fullName,
            });
            // Set custom claims for role
            await auth.setCustomUserClaims(userRecord.uid, { role: data.role });
            // Create Firestore user document
            const userData = {
                email: data.email,
                fullName: data.fullName,
                phoneNumber: data.phoneNumber,
                role: data.role,
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
                isActive: true,
            };
            await this.usersCollection.doc(userRecord.uid).set(userData);
            // If created via admin panel with an admin role, also add to admins collection
            const roleLower = (data.role || '').toString().toLowerCase();
            if (roleLower.includes('admin')) {
                const adminsCollection = db.collection('admins');
                await adminsCollection.doc(userRecord.uid).set(userData);
            }
            return {
                uid: userRecord.uid,
                ...userData,
            };
        }
        catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }
    async getUserById(uid) {
        try {
            const doc = await this.usersCollection.doc(uid).get();
            if (!doc.exists) {
                return null;
            }
            return { uid: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }
    async getAllUsers(role) {
        try {
            let query = this.usersCollection;
            if (role) {
                query = query.where('role', '==', role);
            }
            const snapshot = await query.get();
            const users = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
            // Enrich users with idNumber from patients collection
            const patientsSnapshot = await db.collection('patients').get();
            const patientIdMap = new Map();
            for (const pDoc of patientsSnapshot.docs) {
                const pData = pDoc.data();
                if (pData.idNumber) {
                    // Map by userId field or by doc ID
                    if (pData.userId) {
                        patientIdMap.set(pData.userId, pData.idNumber);
                    }
                    patientIdMap.set(pDoc.id, pData.idNumber);
                }
            }
            for (const user of users) {
                if (!user.idNumber) {
                    user.idNumber = patientIdMap.get(user.uid) || undefined;
                }
            }
            return users;
        }
        catch (error) {
            throw new Error(`Failed to get users: ${error.message}`);
        }
    }
    async updateUser(uid, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: admin.firestore.Timestamp.now(),
            };
            await this.usersCollection.doc(uid).update(updateData);
            // Update display name in Auth if fullName is provided
            if (data.fullName) {
                await auth.updateUser(uid, { displayName: data.fullName });
            }
            // Sync relevant fields to patients collection
            const syncFields = {};
            if (data.fullName)
                syncFields.fullName = data.fullName;
            if (data.phoneNumber !== undefined)
                syncFields.phoneNumber = data.phoneNumber;
            if (data.idNumber !== undefined)
                syncFields.idNumber = data.idNumber;
            if (Object.keys(syncFields).length > 0) {
                // Find patient doc by userId field matching this uid
                const patientsSnapshot = await db.collection('patients').where('userId', '==', uid).get();
                if (!patientsSnapshot.empty) {
                    for (const doc of patientsSnapshot.docs) {
                        await doc.ref.update({ ...syncFields, updatedAt: admin.firestore.Timestamp.now() });
                    }
                }
                // Also check if patient doc ID matches uid directly
                const directPatientDoc = await db.collection('patients').doc(uid).get();
                if (directPatientDoc.exists && patientsSnapshot.empty) {
                    await directPatientDoc.ref.update({ ...syncFields, updatedAt: admin.firestore.Timestamp.now() });
                }
            }
            const updatedUser = await this.getUserById(uid);
            if (!updatedUser) {
                throw new Error('User not found after update');
            }
            return updatedUser;
        }
        catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }
    async deleteUser(uid) {
        try {
            // Delete from Firebase Auth
            await auth.deleteUser(uid);
            // Delete from Firestore users collection
            await this.usersCollection.doc(uid).delete();
            // Delete corresponding patient record
            // Check by userId field
            const patientsSnapshot = await db.collection('patients').where('userId', '==', uid).get();
            for (const doc of patientsSnapshot.docs) {
                await doc.ref.delete();
            }
            // Also check if patient doc ID matches uid directly
            const directPatientDoc = await db.collection('patients').doc(uid).get();
            if (directPatientDoc.exists) {
                await directPatientDoc.ref.delete();
            }
        }
        catch (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }
    async deactivateUser(uid) {
        try {
            await this.usersCollection.doc(uid).update({
                isActive: false,
                updatedAt: admin.firestore.Timestamp.now(),
            });
            await auth.updateUser(uid, { disabled: true });
        }
        catch (error) {
            throw new Error(`Failed to deactivate user: ${error.message}`);
        }
    }
    async activateUser(uid) {
        try {
            await this.usersCollection.doc(uid).update({
                isActive: true,
                updatedAt: admin.firestore.Timestamp.now(),
            });
            await auth.updateUser(uid, { disabled: false });
        }
        catch (error) {
            throw new Error(`Failed to activate user: ${error.message}`);
        }
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=userService.js.map