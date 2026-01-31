"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const newsController_1 = require("../controllers/newsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/published', newsController_1.newsController.getPublishedNews.bind(newsController_1.newsController));
router.use(auth_1.authenticate);
router.use(auth_1.authorizeAdmin);
router.post('/', newsController_1.newsController.createNews.bind(newsController_1.newsController));
router.get('/', newsController_1.newsController.getAllNews.bind(newsController_1.newsController));
router.get('/:id', newsController_1.newsController.getNewsById.bind(newsController_1.newsController));
router.put('/:id', newsController_1.newsController.updateNews.bind(newsController_1.newsController));
router.delete('/:id', newsController_1.newsController.deleteNews.bind(newsController_1.newsController));
exports.default = router;
//# sourceMappingURL=newsRoutes.js.map