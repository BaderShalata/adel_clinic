import { Router } from 'express';
import { waitingListController } from '../controllers/waitingListController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

// All waiting list routes require authentication and admin role
router.use(authenticate);
router.use(authorizeAdmin);

// CRUD operations
router.post('/', waitingListController.addToWaitingList.bind(waitingListController));
router.get('/', waitingListController.getWaitingList.bind(waitingListController));
router.get('/:id', waitingListController.getWaitingListEntry.bind(waitingListController));
router.put('/:id', waitingListController.updateWaitingListEntry.bind(waitingListController));
router.delete('/:id', waitingListController.removeFromWaitingList.bind(waitingListController));

// Book from waiting list
router.post('/:id/book', waitingListController.bookFromWaitingList.bind(waitingListController));

export default router;
