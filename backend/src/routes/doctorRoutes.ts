import { Router } from 'express';
import { doctorController } from '../controllers/doctorController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

// Public routes - no auth required (patients can browse doctors before logging in)
router.get('/', doctorController.getAllDoctors.bind(doctorController));
router.get('/specialty/:specialty', doctorController.getDoctorsBySpecialty.bind(doctorController));
router.get('/:id', doctorController.getDoctorById.bind(doctorController));
router.get('/:id/schedule/weekly', doctorController.getDoctorWeeklySchedule.bind(doctorController));
router.get('/:id/schedule/slots', doctorController.getDoctorAvailableSlots.bind(doctorController));
router.get('/:id/available-slots', doctorController.getAvailableSlotsForDate.bind(doctorController));

// Admin routes - require auth
router.use(authenticate);
router.use(authorizeAdmin);

router.post('/', doctorController.createDoctor.bind(doctorController));
router.post('/with-schedule', doctorController.createDoctorWithSchedule.bind(doctorController));
router.put('/:id', doctorController.updateDoctor.bind(doctorController));
router.put('/:id/schedule', doctorController.updateDoctorSchedule.bind(doctorController));
router.delete('/:id', doctorController.deleteDoctor.bind(doctorController));

export default router;
