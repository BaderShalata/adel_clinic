"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointmentController_1 = require("../controllers/appointmentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Patient-facing routes (any authenticated user can book)
router.post('/book', appointmentController_1.appointmentController.bookAppointment.bind(appointmentController_1.appointmentController));
router.get('/my', appointmentController_1.appointmentController.getMyAppointments.bind(appointmentController_1.appointmentController));
// Admin/Doctor routes
router.post('/', auth_1.authorizeDoctorOrAdmin, appointmentController_1.appointmentController.createAppointment.bind(appointmentController_1.appointmentController));
router.get('/', auth_1.authorizeDoctorOrAdmin, appointmentController_1.appointmentController.getAllAppointments.bind(appointmentController_1.appointmentController));
router.get('/today', auth_1.authorizeDoctorOrAdmin, appointmentController_1.appointmentController.getTodayAppointments.bind(appointmentController_1.appointmentController));
router.get('/:id', auth_1.authorizeDoctorOrAdmin, appointmentController_1.appointmentController.getAppointmentById.bind(appointmentController_1.appointmentController));
router.put('/:id', auth_1.authorizeDoctorOrAdmin, appointmentController_1.appointmentController.updateAppointment.bind(appointmentController_1.appointmentController));
router.delete('/:id', auth_1.authorizeDoctorOrAdmin, appointmentController_1.appointmentController.deleteAppointment.bind(appointmentController_1.appointmentController));
exports.default = router;
//# sourceMappingURL=appointmentRoutes.js.map