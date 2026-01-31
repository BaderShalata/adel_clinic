"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointmentController_1 = require("../controllers/appointmentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.authorizeDoctorOrAdmin);
router.post('/', appointmentController_1.appointmentController.createAppointment.bind(appointmentController_1.appointmentController));
router.get('/', appointmentController_1.appointmentController.getAllAppointments.bind(appointmentController_1.appointmentController));
router.get('/today', appointmentController_1.appointmentController.getTodayAppointments.bind(appointmentController_1.appointmentController));
router.get('/:id', appointmentController_1.appointmentController.getAppointmentById.bind(appointmentController_1.appointmentController));
router.put('/:id', appointmentController_1.appointmentController.updateAppointment.bind(appointmentController_1.appointmentController));
router.delete('/:id', appointmentController_1.appointmentController.deleteAppointment.bind(appointmentController_1.appointmentController));
exports.default = router;
//# sourceMappingURL=appointmentRoutes.js.map