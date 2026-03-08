"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public endpoint - mobile app checks this
router.get('/clinic/status', settingsController_1.settingsController.getClinicStatus.bind(settingsController_1.settingsController));
// Admin only
router.use(auth_1.authenticate);
router.use(auth_1.authorizeAdmin);
router.post('/clinic/lock', settingsController_1.settingsController.setClinicLock.bind(settingsController_1.settingsController));
exports.default = router;
//# sourceMappingURL=settingsRoutes.js.map