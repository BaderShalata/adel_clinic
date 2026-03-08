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
const appointmentService_1 = require("../services/appointmentService");
const notificationService_1 = require("../services/notificationService");
const admin = __importStar(require("firebase-admin"));
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
     * Uses atomic transaction to create patient (if needed) and appointment together
     */
    async bookAppointment(req, res) {
        try {
            const uid = req.user?.uid;
            const userEmail = req.user?.email || '';
            const userName = req.user?.name || 'Patient';
            if (!uid) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { doctorId, appointmentDate, appointmentTime, serviceType, duration, notes } = req.body;
            if (!doctorId || !appointmentDate || !appointmentTime || !serviceType) {
                res.status(400).json({ error: 'Missing required fields: doctorId, appointmentDate, appointmentTime, serviceType' });
                return;
            }
            // Use atomic booking method that handles patient creation + appointment in one transaction
            const data = {
                patientId: uid,
                doctorId,
                appointmentDate: new Date(appointmentDate),
                appointmentTime,
                serviceType,
                duration: duration || 15,
                notes,
            };
            const appointment = await appointmentService_1.appointmentService.bookAppointmentAtomic(data, uid, userEmail, userName);
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
    /**
     * Patient cancels their own appointment
     * PUT /api/appointments/my/:id/cancel
     */
    async cancelMyAppointment(req, res) {
        try {
            const uid = req.user?.uid;
            const { id } = req.params;
            if (!uid) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            // Get the appointment to verify ownership
            const appointment = await appointmentService_1.appointmentService.getAppointmentById(id);
            if (!appointment) {
                res.status(404).json({ error: 'Appointment not found' });
                return;
            }
            // Verify the appointment belongs to this patient
            if (appointment.patientId !== uid) {
                res.status(403).json({ error: 'You can only cancel your own appointments' });
                return;
            }
            // Check if appointment can be cancelled (only scheduled/confirmed/pending)
            const cancellableStatuses = ['scheduled', 'confirmed', 'pending'];
            if (!cancellableStatuses.includes(appointment.status)) {
                res.status(400).json({ error: `Cannot cancel appointment with status: ${appointment.status}` });
                return;
            }
            // Update status to cancelled
            const updatedAppointment = await appointmentService_1.appointmentService.updateAppointment(id, {
                status: 'cancelled',
            });
            res.status(200).json(updatedAppointment);
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
            if (endDate) {
                // Set endDate to end of day (23:59:59.999) to include all appointments on that day
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999);
                filters.endDate = endDateObj;
            }
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
            // Fetch current appointment to detect status change
            const oldAppointment = await appointmentService_1.appointmentService.getAppointmentById(id);
            const oldStatus = oldAppointment?.status;
            const appointment = await appointmentService_1.appointmentService.updateAppointment(id, data);
            // Send notification on status change
            if (oldStatus && data.status && oldStatus !== data.status) {
                const aptDate = appointment.appointmentDate;
                const dateObj = typeof aptDate.toDate === 'function' ? aptDate.toDate() : new Date(aptDate);
                const dateStr = dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
                const timeStr = appointment.appointmentTime;
                // Resolve the patient's Firebase Auth UID for FCM lookup
                // patientId may be a patients collection doc ID, not the users collection UID
                let notifyUid = appointment.patientId;
                try {
                    const patientDoc = await admin.firestore().collection('patients').doc(appointment.patientId).get();
                    if (patientDoc.exists && patientDoc.data()?.userId) {
                        notifyUid = patientDoc.data().userId;
                    }
                }
                catch (err) {
                    console.error('Failed to resolve patient userId for notification:', err);
                }
                if (data.status === 'scheduled') {
                    await notificationService_1.notificationService.sendAppointmentConfirmed(notifyUid, dateStr, timeStr);
                }
                else if (data.status === 'cancelled') {
                    await notificationService_1.notificationService.sendAppointmentCancelled(notifyUid, dateStr);
                }
            }
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
    /**
     * Delete a user's own past/cancelled appointment
     * DELETE /api/appointments/my/:id
     */
    async deleteMyAppointment(req, res) {
        try {
            const uid = req.user?.uid;
            const { id } = req.params;
            if (!uid) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const appointmentId = id;
            // Get the appointment to verify ownership
            const appointment = await appointmentService_1.appointmentService.getAppointmentById(appointmentId);
            if (!appointment) {
                res.status(404).json({ error: 'Appointment not found' });
                return;
            }
            // Verify the appointment belongs to this user
            if (appointment.patientId !== uid && appointment.createdBy !== uid) {
                res.status(403).json({ error: 'You can only delete your own appointments' });
                return;
            }
            // Only allow deleting past, cancelled, or completed appointments
            const validStatuses = ['cancelled', 'completed', 'no_show'];
            const appointmentDate = appointment.appointmentDate instanceof Date
                ? appointment.appointmentDate
                : appointment.appointmentDate.toDate();
            const isPast = appointmentDate < new Date();
            if (!validStatuses.includes(appointment.status) && !isPast) {
                res.status(400).json({ error: 'You can only delete past, cancelled, or completed appointments' });
                return;
            }
            await appointmentService_1.appointmentService.deleteAppointment(appointmentId);
            res.status(200).json({ message: 'Appointment deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Clear all past/cancelled appointments for the current user
     * DELETE /api/appointments/my/clear-history
     */
    async clearMyHistory(req, res) {
        try {
            const uid = req.user?.uid;
            if (!uid) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            // Get all user's appointments
            const appointments = await appointmentService_1.appointmentService.getAllAppointments({ patientId: uid });
            // Filter for deletable appointments (past, cancelled, completed)
            const now = new Date();
            const toDelete = appointments.filter(apt => {
                const appointmentDate = apt.appointmentDate instanceof Date
                    ? apt.appointmentDate
                    : apt.appointmentDate.toDate();
                const isPast = appointmentDate < now;
                const isDeletableStatus = ['cancelled', 'completed', 'no_show'].includes(apt.status);
                return isPast || isDeletableStatus;
            });
            // Delete each appointment
            let deletedCount = 0;
            for (const apt of toDelete) {
                try {
                    await appointmentService_1.appointmentService.deleteAppointment(apt.id);
                    deletedCount++;
                }
                catch (e) {
                    console.error(`Failed to delete appointment ${apt.id}:`, e);
                }
            }
            res.status(200).json({
                message: `Cleared ${deletedCount} appointments from history`,
                deletedCount
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AppointmentController = AppointmentController;
exports.appointmentController = new AppointmentController();
//# sourceMappingURL=appointmentController.js.map