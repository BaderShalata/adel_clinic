"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockedSlotController = void 0;
const lockedSlotService_1 = require("../services/lockedSlotService");
exports.lockedSlotController = {
    /**
     * Create a new locked slot
     * POST /api/locked-slots
     */
    async createLockedSlot(req, res) {
        try {
            const { doctorId, date, time, reason } = req.body;
            const userId = req.user?.uid || 'system';
            if (!doctorId || !date || !time) {
                return res.status(400).json({ error: 'doctorId, date, and time are required' });
            }
            const lockedSlot = await lockedSlotService_1.lockedSlotService.createLockedSlot({ doctorId, date, time, reason }, userId);
            return res.status(201).json(lockedSlot);
        }
        catch (error) {
            console.error('Error creating locked slot:', error);
            if (error.message === 'This slot is already locked') {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message || 'Failed to create locked slot' });
        }
    },
    /**
     * Get locked slots for a doctor on a date
     * GET /api/locked-slots/doctor/:doctorId/date/:date
     */
    async getLockedSlotsByDate(req, res) {
        try {
            const doctorId = req.params.doctorId;
            const date = req.params.date;
            if (!doctorId || !date) {
                return res.status(400).json({ error: 'doctorId and date are required' });
            }
            const lockedSlots = await lockedSlotService_1.lockedSlotService.getLockedSlotsByDate(doctorId, new Date(date));
            return res.json(lockedSlots);
        }
        catch (error) {
            console.error('Error getting locked slots:', error);
            return res.status(500).json({ error: error.message || 'Failed to get locked slots' });
        }
    },
    /**
     * Get all locked slots for a doctor
     * GET /api/locked-slots/doctor/:doctorId
     */
    async getLockedSlotsByDoctor(req, res) {
        try {
            const doctorId = req.params.doctorId;
            if (!doctorId) {
                return res.status(400).json({ error: 'doctorId is required' });
            }
            const lockedSlots = await lockedSlotService_1.lockedSlotService.getLockedSlotsByDoctor(doctorId);
            return res.json(lockedSlots);
        }
        catch (error) {
            console.error('Error getting locked slots:', error);
            return res.status(500).json({ error: error.message || 'Failed to get locked slots' });
        }
    },
    /**
     * Delete a locked slot by ID
     * DELETE /api/locked-slots/:id
     */
    async deleteLockedSlot(req, res) {
        try {
            const id = req.params.id;
            if (!id) {
                return res.status(400).json({ error: 'Locked slot ID is required' });
            }
            await lockedSlotService_1.lockedSlotService.deleteLockedSlot(id);
            return res.json({ message: 'Locked slot deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting locked slot:', error);
            return res.status(500).json({ error: error.message || 'Failed to delete locked slot' });
        }
    },
    /**
     * Delete a locked slot by details (doctorId, date, time)
     * DELETE /api/locked-slots/doctor/:doctorId/date/:date/time/:time
     */
    async deleteLockedSlotByDetails(req, res) {
        try {
            const doctorId = req.params.doctorId;
            const date = req.params.date;
            const time = req.params.time;
            if (!doctorId || !date || !time) {
                return res.status(400).json({ error: 'doctorId, date, and time are required' });
            }
            const deleted = await lockedSlotService_1.lockedSlotService.deleteLockedSlotByDetails(doctorId, date, time);
            if (!deleted) {
                return res.status(404).json({ error: 'Locked slot not found' });
            }
            return res.json({ message: 'Locked slot deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting locked slot:', error);
            return res.status(500).json({ error: error.message || 'Failed to delete locked slot' });
        }
    },
    /**
     * Check if a slot is locked
     * GET /api/locked-slots/check?doctorId=...&date=...&time=...
     */
    async checkSlotLocked(req, res) {
        try {
            const doctorId = req.query.doctorId;
            const date = req.query.date;
            const time = req.query.time;
            if (!doctorId || !date || !time) {
                return res.status(400).json({ error: 'doctorId, date, and time are required' });
            }
            const isLocked = await lockedSlotService_1.lockedSlotService.isSlotLocked(doctorId, date, time);
            return res.json({ locked: isLocked });
        }
        catch (error) {
            console.error('Error checking locked slot:', error);
            return res.status(500).json({ error: error.message || 'Failed to check locked slot' });
        }
    },
};
//# sourceMappingURL=lockedSlotController.js.map