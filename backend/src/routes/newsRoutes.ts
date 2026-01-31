import { Router } from 'express';
import { newsController } from '../controllers/newsController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

router.get('/published', newsController.getPublishedNews.bind(newsController));

router.use(authenticate);
router.use(authorizeAdmin);

router.post('/', newsController.createNews.bind(newsController));
router.get('/', newsController.getAllNews.bind(newsController));
router.get('/:id', newsController.getNewsById.bind(newsController));
router.put('/:id', newsController.updateNews.bind(newsController));
router.delete('/:id', newsController.deleteNews.bind(newsController));

export default router;
