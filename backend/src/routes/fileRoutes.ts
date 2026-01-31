import { Router } from 'express';
import { fileController } from '../controllers/fileController';
import { authenticate, authorizeDoctorOrAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeDoctorOrAdmin);

router.post('/', fileController.createFile.bind(fileController));
router.get('/', fileController.getAllFiles.bind(fileController));
router.get('/patient/:patientId', fileController.getFilesByPatient.bind(fileController));
router.get('/:id', fileController.getFileById.bind(fileController));
router.put('/:id', fileController.updateFile.bind(fileController));
router.delete('/:id', fileController.deleteFile.bind(fileController));

export default router;
