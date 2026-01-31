import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

router.post('/', userController.createUser.bind(userController));
router.get('/', userController.getAllUsers.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));
router.put('/:id', userController.updateUser.bind(userController));
router.delete('/:id', userController.deleteUser.bind(userController));
router.post('/:id/deactivate', userController.deactivateUser.bind(userController));
router.post('/:id/activate', userController.activateUser.bind(userController));

export default router;
