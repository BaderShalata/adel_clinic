import { Router } from 'express';
import { lockedSlotController } from '../controllers/lockedSlotController';
import { authenticate, authorizeDoctorOrAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All routes require admin or doctor role
router.use(authorizeDoctorOrAdmin);

// Create a locked slot
router.post('/', lockedSlotController.createLockedSlot);

// Check if a slot is locked
router.get('/check', lockedSlotController.checkSlotLocked);

// Get locked slots for a doctor on a specific date
router.get('/doctor/:doctorId/date/:date', lockedSlotController.getLockedSlotsByDate);

// Get all locked slots for a doctor
router.get('/doctor/:doctorId', lockedSlotController.getLockedSlotsByDoctor);

// Delete a locked slot by ID
router.delete('/:id', lockedSlotController.deleteLockedSlot);

// Delete a locked slot by details (doctorId, date, time)
router.delete('/doctor/:doctorId/date/:date/time/:time', lockedSlotController.deleteLockedSlotByDetails);

export default router;
