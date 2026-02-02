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
exports.patientService = exports.PatientService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class PatientService {
    constructor() {
        this.patientsCollection = db.collection('patients');
    }
    async createPatient(data) {
        try {
            const patientData = {
                fullName: data.fullName,
                dateOfBirth: data.dateOfBirth instanceof Date
                    ? admin.firestore.Timestamp.fromDate(data.dateOfBirth)
                    : data.dateOfBirth,
                gender: data.gender,
                phoneNumber: data.phoneNumber || '',
                email: data.email || '',
                allergies: data.allergies || [],
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
            };
            // Only add optional fields if they have values (Firestore doesn't accept undefined)
            if (data.userId)
                patientData.userId = data.userId;
            if (data.idNumber)
                patientData.idNumber = data.idNumber;
            if (data.address)
                patientData.address = data.address;
            if (data.medicalHistory)
                patientData.medicalHistory = data.medicalHistory;
            if (data.emergencyContact)
                patientData.emergencyContact = data.emergencyContact;
            const docRef = await this.patientsCollection.add(patientData);
            return {
                id: docRef.id,
                ...patientData,
            };
        }
        catch (error) {
            throw new Error(`Failed to create patient: ${error.message}`);
        }
    }
    async getPatientById(id) {
        try {
            const doc = await this.patientsCollection.doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get patient: ${error.message}`);
        }
    }
    async getPatientByUserId(userId) {
        try {
            const snapshot = await this.patientsCollection.where('userId', '==', userId).limit(1).get();
            if (snapshot.empty) {
                return null;
            }
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get patient by userId: ${error.message}`);
        }
    }
    async getAllPatients(search) {
        try {
            let query = this.patientsCollection.orderBy('createdAt', 'desc');
            const snapshot = await query.get();
            let patients = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Simple client-side search filter
            if (search) {
                const searchLower = search.toLowerCase();
                patients = patients.filter(p => p.fullName.toLowerCase().includes(searchLower) ||
                    p.phoneNumber.includes(search) ||
                    (p.email && p.email.toLowerCase().includes(searchLower)));
            }
            return patients;
        }
        catch (error) {
            throw new Error(`Failed to get patients: ${error.message}`);
        }
    }
    async updatePatient(id, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: admin.firestore.Timestamp.now(),
            };
            if (data.dateOfBirth && data.dateOfBirth instanceof Date) {
                updateData.dateOfBirth = admin.firestore.Timestamp.fromDate(data.dateOfBirth);
            }
            await this.patientsCollection.doc(id).update(updateData);
            const updatedPatient = await this.getPatientById(id);
            if (!updatedPatient) {
                throw new Error('Patient not found after update');
            }
            return updatedPatient;
        }
        catch (error) {
            throw new Error(`Failed to update patient: ${error.message}`);
        }
    }
    async deletePatient(id) {
        try {
            await this.patientsCollection.doc(id).delete();
        }
        catch (error) {
            throw new Error(`Failed to delete patient: ${error.message}`);
        }
    }
    async getPatientStats() {
        try {
            const allPatientsSnapshot = await this.patientsCollection.get();
            const total = allPatientsSnapshot.size;
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);
            const newThisMonthSnapshot = await this.patientsCollection
                .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(firstDayOfMonth))
                .get();
            return {
                total,
                newThisMonth: newThisMonthSnapshot.size,
            };
        }
        catch (error) {
            throw new Error(`Failed to get patient stats: ${error.message}`);
        }
    }
}
exports.PatientService = PatientService;
exports.patientService = new PatientService();
//# sourceMappingURL=patientService.js.map