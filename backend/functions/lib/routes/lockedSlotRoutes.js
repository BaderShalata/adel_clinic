"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lockedSlotController_1 = require("../controllers/lockedSlotController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// All routes require admin or doctor role
router.use(auth_1.authorizeDoctorOrAdmin);
// Create a locked slot
router.post('/', lockedSlotController_1.lockedSlotController.createLockedSlot);
// Check if a slot is locked
router.get('/check', lockedSlotController_1.lockedSlotController.checkSlotLocked);
// Get locked slots for a doctor on a specific date
router.get('/doctor/:doctorId/date/:date', lockedSlotController_1.lockedSlotController.getLockedSlotsByDate);
// Get all locked slots for a doctor
router.get('/doctor/:doctorId', lockedSlotController_1.lockedSlotController.getLockedSlotsByDoctor);
// Delete a locked slot by ID
router.delete('/:id', lockedSlotController_1.lockedSlotController.deleteLockedSlot);
// Delete a locked slot by details (doctorId, date, time)
router.delete('/doctor/:doctorId/date/:date/time/:time', lockedSlotController_1.lockedSlotController.deleteLockedSlotByDetails);
exports.default = router;
//# sourceMappingURL=lockedSlotRoutes.js.map