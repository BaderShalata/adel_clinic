import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController';
import { authenticate, authorizeDoctorOrAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Patient-facing routes (any authenticated user can book)
router.post('/book', appointmentController.bookAppointment.bind(appointmentController));
router.get('/my', appointmentController.getMyAppointments.bind(appointmentController));
router.put('/my/:id/cancel', appointmentController.cancelMyAppointment.bind(appointmentController));
// Note: clear-history must come BEFORE :id route to avoid matching "clear-history" as an id
router.delete('/my/clear-history', appointmentController.clearMyHistory.bind(appointmentController));
router.delete('/my/:id', appointmentController.deleteMyAppointment.bind(appointmentController));

// Admin/Doctor routes
router.post('/', authorizeDoctorOrAdmin, appointmentController.createAppointment.bind(appointmentController));
router.get('/', authorizeDoctorOrAdmin, appointmentController.getAllAppointments.bind(appointmentController));
router.get('/today', authorizeDoctorOrAdmin, appointmentController.getTodayAppointments.bind(appointmentController));
router.get('/:id', authorizeDoctorOrAdmin, appointmentController.getAppointmentById.bind(appointmentController));
router.put('/:id', authorizeDoctorOrAdmin, appointmentController.updateAppointment.bind(appointmentController));
router.delete('/:id', authorizeDoctorOrAdmin, appointmentController.deleteAppointment.bind(appointmentController));

export default router;
