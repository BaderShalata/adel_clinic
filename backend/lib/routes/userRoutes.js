"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.authorizeAdmin);
router.post('/', userController_1.userController.createUser.bind(userController_1.userController));
router.get('/', userController_1.userController.getAllUsers.bind(userController_1.userController));
router.get('/:id', userController_1.userController.getUserById.bind(userController_1.userController));
router.put('/:id', userController_1.userController.updateUser.bind(userController_1.userController));
router.delete('/:id', userController_1.userController.deleteUser.bind(userController_1.userController));
router.post('/:id/deactivate', userController_1.userController.deactivateUser.bind(userController_1.userController));
router.post('/:id/activate', userController_1.userController.activateUser.bind(userController_1.userController));
exports.default = router;
//# sourceMappingURL=userRoutes.js.map