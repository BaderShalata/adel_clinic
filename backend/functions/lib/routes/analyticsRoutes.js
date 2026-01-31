"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.authorizeDoctorOrAdmin);
router.get('/', analyticsController_1.analyticsController.getAnalytics.bind(analyticsController_1.analyticsController));
router.get('/trends', analyticsController_1.analyticsController.getAppointmentTrends.bind(analyticsController_1.analyticsController));
exports.default = router;
//# sourceMappingURL=analyticsRoutes.js.map