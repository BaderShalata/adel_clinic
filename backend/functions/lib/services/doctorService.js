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
exports.doctorService = exports.DoctorService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class DoctorService {
    constructor() {
        this.doctorsCollection = db.collection('doctors');
    }
    async createDoctor(data) {
        try {
            const doctorData = {
                userId: data.userId,
                fullName: data.fullName,
                fullNameEn: data.fullNameEn,
                fullNameHe: data.fullNameHe,
                specialties: data.specialties,
                specialtiesEn: data.specialtiesEn,
                specialtiesHe: data.specialtiesHe,
                qualifications: data.qualifications,
                qualificationsEn: data.qualificationsEn,
                qualificationsHe: data.qualificationsHe,
                schedule: data.schedule,
                isActive: true,
                createdAt: admin.firestore.Timestamp.now(),
            };
            const docRef = await this.doctorsCollection.add(doctorData);
            return {
                id: docRef.id,
                ...doctorData,
            };
        }
        catch (error) {
            throw new Error(`Failed to create doctor: ${error.message}`);
        }
    }
    async getDoctorById(id) {
        try {
            const doc = await this.doctorsCollection.doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get doctor: ${error.message}`);
        }
    }
    async getDoctorByUserId(userId) {
        try {
            const snapshot = await this.doctorsCollection.where('userId', '==', userId).limit(1).get();
            if (snapshot.empty) {
                return null;
            }
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get doctor by userId: ${error.message}`);
        }
    }
    async getAllDoctors(activeOnly = false) {
        try {
            let query = this.doctorsCollection;
            if (activeOnly) {
                query = query.where('isActive', '==', true);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            throw new Error(`Failed to get doctors: ${error.message}`);
        }
    }
    async updateDoctor(id, data) {
        try {
            await this.doctorsCollection.doc(id).update(data);
            const updatedDoctor = await this.getDoctorById(id);
            if (!updatedDoctor) {
                throw new Error('Doctor not found after update');
            }
            return updatedDoctor;
        }
        catch (error) {
            throw new Error(`Failed to update doctor: ${error.message}`);
        }
    }
    async deleteDoctor(id) {
        try {
            await this.doctorsCollection.doc(id).delete();
        }
        catch (error) {
            throw new Error(`Failed to delete doctor: ${error.message}`);
        }
    }
    async getDoctorsBySpecialty(specialty) {
        try {
            const snapshot = await this.doctorsCollection
                .where('specialties', 'array-contains', specialty)
                .where('isActive', '==', true)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            throw new Error(`Failed to get doctors by specialty: ${error.message}`);
        }
    }
}
exports.DoctorService = DoctorService;
exports.doctorService = new DoctorService();
//# sourceMappingURL=doctorService.js.map