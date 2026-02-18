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
            // Clean schedule entries - remove undefined values that Firestore doesn't accept
            const cleanSchedule = (data.schedule || []).map(entry => {
                const clean = {
                    dayOfWeek: entry.dayOfWeek,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    slotDuration: entry.slotDuration,
                };
                // Only include type if it's defined and not empty
                if (entry.type !== undefined && entry.type !== null && entry.type !== '') {
                    clean.type = entry.type;
                }
                return clean;
            });
            // Build doctor data, excluding undefined optional fields
            const doctorData = {
                userId: data.userId,
                fullName: data.fullName,
                specialties: data.specialties || [],
                qualifications: data.qualifications || [],
                schedule: cleanSchedule,
                isActive: true,
                createdAt: admin.firestore.Timestamp.now(),
            };
            // Only add optional fields if they have values
            if (data.fullNameEn)
                doctorData.fullNameEn = data.fullNameEn;
            if (data.fullNameHe)
                doctorData.fullNameHe = data.fullNameHe;
            if (data.specialtiesEn?.length)
                doctorData.specialtiesEn = data.specialtiesEn;
            if (data.specialtiesHe?.length)
                doctorData.specialtiesHe = data.specialtiesHe;
            if (data.qualificationsEn?.length)
                doctorData.qualificationsEn = data.qualificationsEn;
            if (data.qualificationsHe?.length)
                doctorData.qualificationsHe = data.qualificationsHe;
            if (data.bio)
                doctorData.bio = data.bio;
            if (data.bioEn)
                doctorData.bioEn = data.bioEn;
            if (data.bioHe)
                doctorData.bioHe = data.bioHe;
            if (data.imageUrl)
                doctorData.imageUrl = data.imageUrl;
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
            // Clean the update data - remove undefined values
            const cleanData = {};
            // Copy defined values only
            if (data.fullName !== undefined)
                cleanData.fullName = data.fullName;
            if (data.fullNameEn !== undefined)
                cleanData.fullNameEn = data.fullNameEn;
            if (data.fullNameHe !== undefined)
                cleanData.fullNameHe = data.fullNameHe;
            if (data.specialties !== undefined)
                cleanData.specialties = data.specialties;
            if (data.specialtiesEn !== undefined)
                cleanData.specialtiesEn = data.specialtiesEn;
            if (data.specialtiesHe !== undefined)
                cleanData.specialtiesHe = data.specialtiesHe;
            if (data.qualifications !== undefined)
                cleanData.qualifications = data.qualifications;
            if (data.qualificationsEn !== undefined)
                cleanData.qualificationsEn = data.qualificationsEn;
            if (data.qualificationsHe !== undefined)
                cleanData.qualificationsHe = data.qualificationsHe;
            if (data.bio !== undefined)
                cleanData.bio = data.bio;
            if (data.bioEn !== undefined)
                cleanData.bioEn = data.bioEn;
            if (data.bioHe !== undefined)
                cleanData.bioHe = data.bioHe;
            if (data.imageUrl !== undefined)
                cleanData.imageUrl = data.imageUrl;
            if (data.isActive !== undefined)
                cleanData.isActive = data.isActive;
            // Clean schedule entries if present
            if (data.schedule !== undefined) {
                cleanData.schedule = data.schedule.map(entry => {
                    const clean = {
                        dayOfWeek: entry.dayOfWeek,
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        slotDuration: entry.slotDuration,
                    };
                    if (entry.type !== undefined && entry.type !== null && entry.type !== '') {
                        clean.type = entry.type;
                    }
                    return clean;
                });
            }
            await this.doctorsCollection.doc(id).update(cleanData);
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