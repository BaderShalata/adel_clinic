"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitingListController = exports.WaitingListController = void 0;
const waitingListService_1 = require("../services/waitingListService");
class WaitingListController {
    /**
     * Add a patient to the waiting list
     * POST /api/waiting-list
     */
    async addToWaitingList(req, res) {
        try {
            const data = {
                patientId: req.body.patientId,
                doctorId: req.body.doctorId,
                serviceType: req.body.serviceType,
                preferredDate: new Date(req.body.preferredDate),
                priority: req.body.priority,
                notes: req.body.notes,
            };
            const createdBy = req.user?.uid || 'system';
            const entry = await waitingListService_1.waitingListService.addToWaitingList(data, createdBy);
            res.status(201).json(entry);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Get all waiting list entries with optional filters
     * GET /api/waiting-list
     * Query params: doctorId, patientId, status, date (YYYY-MM-DD)
     */
    async getWaitingList(req, res) {
        try {
            const { doctorId, patientId, status, date } = req.query;
            const filters = {};
            if (doctorId)
                filters.doctorId = doctorId;
            if (patientId)
                filters.patientId = patientId;
            if (status)
                filters.status = status;
            if (date)
                filters.date = new Date(date);
            const entries = await waitingListService_1.waitingListService.getWaitingList(filters);
            res.status(200).json(entries);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Get a specific waiting list entry
     * GET /api/waiting-list/:id
     */
    async getWaitingListEntry(req, res) {
        try {
            const { id } = req.params;
            const entry = await waitingListService_1.waitingListService.getWaitingListById(id);
            if (!entry) {
                res.status(404).json({ error: 'Waiting list entry not found' });
                return;
            }
            res.status(200).json(entry);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Update a waiting list entry
     * PUT /api/waiting-list/:id
     */
    async updateWaitingListEntry(req, res) {
        try {
            const { id } = req.params;
            const data = {};
            if (req.body.preferredDate) {
                data.preferredDate = new Date(req.body.preferredDate);
            }
            if (req.body.status)
                data.status = req.body.status;
            if (req.body.priority !== undefined)
                data.priority = req.body.priority;
            if (req.body.notes !== undefined)
                data.notes = req.body.notes;
            const entry = await waitingListService_1.waitingListService.updateWaitingListEntry(id, data);
            res.status(200).json(entry);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Remove from waiting list
     * DELETE /api/waiting-list/:id
     */
    async removeFromWaitingList(req, res) {
        try {
            const { id } = req.params;
            await waitingListService_1.waitingListService.removeFromWaitingList(id);
            res.status(200).json({ message: 'Removed from waiting list' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Book an appointment from waiting list entry
     * POST /api/waiting-list/:id/book
     * Body: { appointmentDate: "YYYY-MM-DD", appointmentTime: "HH:MM" }
     */
    async bookFromWaitingList(req, res) {
        try {
            const { id } = req.params;
            const { appointmentDate, appointmentTime } = req.body;
            if (!appointmentTime) {
                res.status(400).json({ error: 'appointmentTime is required' });
                return;
            }
            if (!appointmentDate) {
                res.status(400).json({ error: 'appointmentDate is required' });
                return;
            }
            const createdBy = req.user?.uid || 'system';
            const appointment = await waitingListService_1.waitingListService.bookFromWaitingList(id, new Date(appointmentDate), appointmentTime, createdBy);
            res.status(201).json(appointment);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.WaitingListController = WaitingListController;
exports.waitingListController = new WaitingListController();
//# sourceMappingURL=waitingListController.js.map