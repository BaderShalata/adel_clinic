import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController';
import { authenticate, authorizeDoctorOrAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeDoctorOrAdmin);

router.post('/', appointmentController.createAppointment.bind(appointmentController));
router.get('/', appointmentController.getAllAppointments.bind(appointmentController));
router.get('/today', appointmentController.getTodayAppointments.bind(appointmentController));
router.get('/:id', appointmentController.getAppointmentById.bind(appointmentController));
router.put('/:id', appointmentController.updateAppointment.bind(appointmentController));
router.delete('/:id', appointmentController.deleteAppointment.bind(appointmentController));

export default router;
