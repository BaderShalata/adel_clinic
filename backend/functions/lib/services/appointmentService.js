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
exports.appointmentService = exports.AppointmentService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class AppointmentService {
    constructor() {
        this.appointmentsCollection = db.collection('appointments');
        this.patientsCollection = db.collection('patients');
        this.doctorsCollection = db.collection('doctors');
    }
    async createAppointment(data, createdBy, role) {
        try {
            // Fetch patient and doctor details
            const [patientDoc, doctorDoc] = await Promise.all([
                this.patientsCollection.doc(data.patientId).get(),
                this.doctorsCollection.doc(data.doctorId).get(),
            ]);
            if (!patientDoc.exists) {
                throw new Error('Patient not found');
            }
            if (!doctorDoc.exists) {
                throw new Error('Doctor not found');
            }
            const patient = patientDoc.data();
            const doctor = doctorDoc.data();
            // === ROLE-BASED ACCESS ===
            // Admin can create for anyone
            if (role !== 'admin') {
                if (patient?.createdBy && patient.createdBy !== createdBy) {
                    throw new Error('Cannot create appointment for another user');
                }
            }
            // Convert appointmentDate to Date object
            let appointmentDateObj;
            if (data.appointmentDate instanceof Date) {
                appointmentDateObj = data.appointmentDate;
            }
            else if (typeof data.appointmentDate === 'string') {
                appointmentDateObj = new Date(data.appointmentDate);
            }
            else if (data.appointmentDate && typeof data.appointmentDate.toDate === 'function') {
                appointmentDateObj = data.appointmentDate.toDate();
            }
            else {
                throw new Error('Invalid appointment date format');
            }
            // Check for double-booking if appointmentTime is provided
            if (data.appointmentTime) {
                const isAvailable = await this.checkSlotAvailability(data.doctorId, appointmentDateObj, data.appointmentTime);
                if (!isAvailable) {
                    throw new Error('This time slot is no longer available. Please select another time.');
                }
            }
            const appointmentData = {
                patientId: data.patientId,
                patientName: patient?.fullName || '',
                doctorId: data.doctorId,
                doctorName: doctor?.fullName || '',
                appointmentDate: admin.firestore.Timestamp.fromDate(appointmentDateObj),
                appointmentTime: data.appointmentTime || '',
                serviceType: data.serviceType || '',
                duration: data.duration,
                status: 'scheduled',
                notes: data.notes,
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
                createdBy,
            };
            const docRef = await this.appointmentsCollection.add(appointmentData);
            return {
                id: docRef.id,
                ...appointmentData,
            };
        }
        catch (error) {
            throw new Error(`Failed to create appointment: ${error.message}`);
        }
    }
    async checkSlotAvailability(doctorId, date, time) {
        try {
            const dateStr = date.toISOString().split('T')[0];
            const existingAppointments = await this.appointmentsCollection
                .where('doctorId', '==', doctorId)
                .get();
            for (const doc of existingAppointments.docs) {
                const data = doc.data();
                if (data.appointmentDate && data.appointmentTime === time) {
                    const aptDate = data.appointmentDate.toDate();
                    const aptDateStr = aptDate.toISOString().split('T')[0];
                    if (aptDateStr === dateStr && ['scheduled', 'completed'].includes(data.status)) {
                        return false;
                    }
                }
            }
            return true;
        }
        catch (error) {
            throw new Error(`Failed to check slot availability: ${error.message}`);
        }
    }
    async getAppointmentById(id) {
        try {
            const doc = await this.appointmentsCollection.doc(id).get();
            if (!doc.exists)
                return null;
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get appointment: ${error.message}`);
        }
    }
    async getAllAppointments(filters) {
        try {
            let query = this.appointmentsCollection;
            if (filters?.status)
                query = query.where('status', '==', filters.status);
            if (filters?.doctorId)
                query = query.where('doctorId', '==', filters.doctorId);
            if (filters?.patientId)
                query = query.where('patientId', '==', filters.patientId);
            if (filters?.startDate)
                query = query.where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(filters.startDate));
            if (filters?.endDate)
                query = query.where('appointmentDate', '<=', admin.firestore.Timestamp.fromDate(filters.endDate));
            query = query.orderBy('appointmentDate', 'desc');
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            throw new Error(`Failed to get appointments: ${error.message}`);
        }
    }
    async updateAppointment(id, data) {
        try {
            const updateData = { ...data, updatedAt: admin.firestore.Timestamp.now() };
            if (data.appointmentDate && data.appointmentDate instanceof Date) {
                updateData.appointmentDate = admin.firestore.Timestamp.fromDate(data.appointmentDate);
            }
            await this.appointmentsCollection.doc(id).update(updateData);
            const updatedAppointment = await this.getAppointmentById(id);
            if (!updatedAppointment)
                throw new Error('Appointment not found after update');
            return updatedAppointment;
        }
        catch (error) {
            throw new Error(`Failed to update appointment: ${error.message}`);
        }
    }
    async deleteAppointment(id) {
        try {
            await this.appointmentsCollection.doc(id).delete();
        }
        catch (error) {
            throw new Error(`Failed to delete appointment: ${error.message}`);
        }
    }
    async getTodayAppointments(doctorId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            let query = this.appointmentsCollection
                .where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(today))
                .where('appointmentDate', '<', admin.firestore.Timestamp.fromDate(tomorrow));
            if (doctorId)
                query = query.where('doctorId', '==', doctorId);
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            throw new Error(`Failed to get today's appointments: ${error.message}`);
        }
    }
}
exports.AppointmentService = AppointmentService;
exports.appointmentService = new AppointmentService();
//# sourceMappingURL=appointmentService.js.map