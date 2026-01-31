"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorController = exports.DoctorController = void 0;
const doctorService_1 = require("../services/doctorService");
class DoctorController {
    async createDoctor(req, res) {
        try {
            const data = req.body;
            const doctor = await doctorService_1.doctorService.createDoctor(data);
            res.status(201).json(doctor);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getDoctorById(req, res) {
        try {
            const { id } = req.params;
            const doctor = await doctorService_1.doctorService.getDoctorById(id);
            if (!doctor) {
                res.status(404).json({ error: 'Doctor not found' });
                return;
            }
            res.status(200).json(doctor);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAllDoctors(req, res) {
        try {
            const { activeOnly } = req.query;
            const doctors = await doctorService_1.doctorService.getAllDoctors(activeOnly === 'true');
            res.status(200).json(doctors);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateDoctor(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const doctor = await doctorService_1.doctorService.updateDoctor(id, data);
            res.status(200).json(doctor);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deleteDoctor(req, res) {
        try {
            const { id } = req.params;
            await doctorService_1.doctorService.deleteDoctor(id);
            res.status(200).json({ message: 'Doctor deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getDoctorsBySpecialty(req, res) {
        try {
            const { specialty } = req.params;
            const doctors = await doctorService_1.doctorService.getDoctorsBySpecialty(specialty);
            res.status(200).json(doctors);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.DoctorController = DoctorController;
exports.doctorController = new DoctorController();
//# sourceMappingURL=doctorController.js.map