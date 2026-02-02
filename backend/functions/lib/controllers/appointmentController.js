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
exports.appointmentController = exports.AppointmentController = void 0;
const admin = __importStar(require("firebase-admin"));
const appointmentService_1 = require("../services/appointmentService");
class AppointmentController {
    async createAppointment(req, res) {
        try {
            const data = req.body;
            const createdBy = req.user?.uid || '';
            const role = req.user?.role || 'user';
            const appointment = await appointmentService_1.appointmentService.createAppointment(data, createdBy, role);
            res.status(201).json(appointment);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Patient booking endpoint - allows patients to book their own appointments
     * POST /api/appointments/book
     */
    async bookAppointment(req, res) {
        try {
            const uid = req.user?.uid;
            const userEmail = req.user?.email;
            const userName = req.user?.name;
            if (!uid) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { doctorId, appointmentDate, appointmentTime, serviceType, duration, notes } = req.body;
            if (!doctorId || !appointmentDate || !appointmentTime || !serviceType) {
                res.status(400).json({ error: 'Missing required fields: doctorId, appointmentDate, appointmentTime, serviceType' });
                return;
            }
            // Ensure patient exists - create if not
            const db = admin.firestore();
            const patientDoc = await db.collection('patients').doc(uid).get();
            if (!patientDoc.exists) {
                // Create patient document for this user
                await db.collection('patients').doc(uid).set({
                    userId: uid,
                    email: userEmail || '',
                    fullName: userName || 'Patient',
                    role: 'patient',
                    isActive: true,
                    createdAt: admin.firestore.Timestamp.now(),
                    updatedAt: admin.firestore.Timestamp.now(),
                });
                console.log('Created patient document for user:', uid);
            }
            // Patient ID is the user's UID (patients collection uses UID as document ID)
            const data = {
                patientId: uid,
                doctorId,
                appointmentDate: new Date(appointmentDate),
                appointmentTime,
                serviceType,
                duration: duration || 15,
                notes,
            };
            const appointment = await appointmentService_1.appointmentService.createAppointment(data, uid, 'user');
            res.status(201).json(appointment);
        }
        catch (error) {
            console.error('Booking error:', error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Get patient's own appointments
     * GET /api/appointments/my
     */
    async getMyAppointments(req, res) {
        try {
            const uid = req.user?.uid;
            if (!uid) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const appointments = await appointmentService_1.appointmentService.getAllAppointments({ patientId: uid });
            res.status(200).json(appointments);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAppointmentById(req, res) {
        try {
            const { id } = req.params;
            const appointment = await appointmentService_1.appointmentService.getAppointmentById(id);
            if (!appointment) {
                res.status(404).json({ error: 'Appointment not found' });
                return;
            }
            res.status(200).json(appointment);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAllAppointments(req, res) {
        try {
            const { status, doctorId, patientId, startDate, endDate } = req.query;
            const filters = {};
            if (status)
                filters.status = status;
            if (doctorId)
                filters.doctorId = doctorId;
            if (patientId)
                filters.patientId = patientId;
            if (startDate)
                filters.startDate = new Date(startDate);
            if (endDate)
                filters.endDate = new Date(endDate);
            const appointments = await appointmentService_1.appointmentService.getAllAppointments(filters);
            res.status(200).json(appointments);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const appointment = await appointmentService_1.appointmentService.updateAppointment(id, data);
            res.status(200).json(appointment);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deleteAppointment(req, res) {
        try {
            const { id } = req.params;
            await appointmentService_1.appointmentService.deleteAppointment(id);
            res.status(200).json({ message: 'Appointment deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getTodayAppointments(req, res) {
        try {
            const { doctorId } = req.query;
            const appointments = await appointmentService_1.appointmentService.getTodayAppointments(doctorId);
            res.status(200).json(appointments);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AppointmentController = AppointmentController;
exports.appointmentController = new AppointmentController();
//# sourceMappingURL=appointmentController.js.map