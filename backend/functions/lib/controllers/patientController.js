"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientController = exports.PatientController = void 0;
const patientService_1 = require("../services/patientService");
class PatientController {
    async createPatient(req, res) {
        try {
            const data = req.body;
            if (data.userId !== req.user.uid) {
                res.status(403).json({ error: 'Cannot create patient for another user' });
                return;
            }
            const patient = await patientService_1.patientService.createPatient(data);
            res.status(201).json(patient);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getPatientById(req, res) {
        try {
            const { id } = req.params;
            const patient = await patientService_1.patientService.getPatientById(id);
            if (!patient) {
                res.status(404).json({ error: 'Patient not found' });
                return;
            }
            res.status(200).json(patient);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAllPatients(req, res) {
        try {
            const { search } = req.query;
            const patients = await patientService_1.patientService.getAllPatients(search);
            res.status(200).json(patients);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updatePatient(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const patient = await patientService_1.patientService.updatePatient(id, data);
            res.status(200).json(patient);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deletePatient(req, res) {
        try {
            const { id } = req.params;
            await patientService_1.patientService.deletePatient(id);
            res.status(200).json({ message: 'Patient deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getPatientStats(req, res) {
        try {
            const stats = await patientService_1.patientService.getPatientStats();
            res.status(200).json(stats);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.PatientController = PatientController;
exports.patientController = new PatientController();
//# sourceMappingURL=patientController.js.map