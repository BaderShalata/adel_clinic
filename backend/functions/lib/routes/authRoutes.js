"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public endpoints that rely on Firebase ID token in Authorization header
router.post('/register', authController_1.authController.register.bind(authController_1.authController));
router.post('/login', authController_1.authController.login.bind(authController_1.authController));
// Set admin claims for web admin users (call after signup)
router.post('/set-admin-claims', authController_1.authController.setAdminClaims.bind(authController_1.authController));
// Protected endpoint to get current user
router.get('/me', auth_1.authenticate, authController_1.authController.getMe.bind(authController_1.authController));
exports.default = router;
//# sourceMappingURL=authRoutes.js.map