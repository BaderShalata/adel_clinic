"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const waitingListController_1 = require("../controllers/waitingListController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All waiting list routes require authentication and admin role
router.use(auth_1.authenticate);
router.use(auth_1.authorizeAdmin);
// CRUD operations
router.post('/', waitingListController_1.waitingListController.addToWaitingList.bind(waitingListController_1.waitingListController));
router.get('/', waitingListController_1.waitingListController.getWaitingList.bind(waitingListController_1.waitingListController));
router.get('/:id', waitingListController_1.waitingListController.getWaitingListEntry.bind(waitingListController_1.waitingListController));
router.put('/:id', waitingListController_1.waitingListController.updateWaitingListEntry.bind(waitingListController_1.waitingListController));
router.delete('/:id', waitingListController_1.waitingListController.removeFromWaitingList.bind(waitingListController_1.waitingListController));
// Book from waiting list
router.post('/:id/book', waitingListController_1.waitingListController.bookFromWaitingList.bind(waitingListController_1.waitingListController));
exports.default = router;
//# sourceMappingURL=waitingListRoutes.js.map