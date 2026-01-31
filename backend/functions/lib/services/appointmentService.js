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
    async createAppointment(data, createdBy) {
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
            const appointmentData = {
                patientId: data.patientId,
                patientName: patient?.fullName || '',
                doctorId: data.doctorId,
                doctorName: doctor?.fullName || '',
                appointmentDate: data.appointmentDate instanceof Date
                    ? admin.firestore.Timestamp.fromDate(data.appointmentDate)
                    : data.appointmentDate,
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
    async getAppointmentById(id) {
        try {
            const doc = await this.appointmentsCollection.doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get appointment: ${error.message}`);
        }
    }
    async getAllAppointments(filters) {
        try {
            let query = this.appointmentsCollection;
            if (filters?.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters?.doctorId) {
                query = query.where('doctorId', '==', filters.doctorId);
            }
            if (filters?.patientId) {
                query = query.where('patientId', '==', filters.patientId);
            }
            if (filters?.startDate) {
                query = query.where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(filters.startDate));
            }
            if (filters?.endDate) {
                query = query.where('appointmentDate', '<=', admin.firestore.Timestamp.fromDate(filters.endDate));
            }
            query = query.orderBy('appointmentDate', 'desc');
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            throw new Error(`Failed to get appointments: ${error.message}`);
        }
    }
    async updateAppointment(id, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: admin.firestore.Timestamp.now(),
            };
            if (data.appointmentDate && data.appointmentDate instanceof Date) {
                updateData.appointmentDate = admin.firestore.Timestamp.fromDate(data.appointmentDate);
            }
            await this.appointmentsCollection.doc(id).update(updateData);
            const updatedAppointment = await this.getAppointmentById(id);
            if (!updatedAppointment) {
                throw new Error('Appointment not found after update');
            }
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
            if (doctorId) {
                query = query.where('doctorId', '==', doctorId);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            throw new Error(`Failed to get today's appointments: ${error.message}`);
        }
    }
}
exports.AppointmentService = AppointmentService;
exports.appointmentService = new AppointmentService();
//# sourceMappingURL=appointmentService.js.map