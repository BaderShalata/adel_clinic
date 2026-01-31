import { Router } from 'express';
import { patientController } from '../controllers/patientController';
import { authenticate, authorizeDoctorOrAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Allow authenticated users (patients) to create themselves
router.post('/', patientController.createPatient.bind(patientController));

// Restrict everything else
router.use(authorizeDoctorOrAdmin);
router.get('/', patientController.getAllPatients.bind(patientController));
router.get('/stats', patientController.getPatientStats.bind(patientController));
router.get('/:id', patientController.getPatientById.bind(patientController));
router.put('/:id', patientController.updatePatient.bind(patientController));
router.delete('/:id', patientController.deletePatient.bind(patientController));


export default router;
