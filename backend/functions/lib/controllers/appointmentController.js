"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentController = exports.AppointmentController = void 0;
const appointmentService_1 = require("../services/appointmentService");
class AppointmentController {
    async createAppointment(req, res) {
        try {
            const data = req.body;
            const createdBy = req.user?.uid || '';
            const appointment = await appointmentService_1.appointmentService.createAppointment(data, createdBy);
            res.status(201).json(appointment);
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