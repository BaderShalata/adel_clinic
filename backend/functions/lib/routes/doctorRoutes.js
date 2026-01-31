"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doctorController_1 = require("../controllers/doctorController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes - no auth required (patients can browse doctors before logging in)
router.get('/', doctorController_1.doctorController.getAllDoctors.bind(doctorController_1.doctorController));
router.get('/specialty/:specialty', doctorController_1.doctorController.getDoctorsBySpecialty.bind(doctorController_1.doctorController));
router.get('/:id', doctorController_1.doctorController.getDoctorById.bind(doctorController_1.doctorController));
router.get('/:id/schedule/weekly', doctorController_1.doctorController.getDoctorWeeklySchedule.bind(doctorController_1.doctorController));
router.get('/:id/schedule/slots', doctorController_1.doctorController.getDoctorAvailableSlots.bind(doctorController_1.doctorController));
// Admin routes - require auth
router.use(auth_1.authenticate);
router.use(auth_1.authorizeAdmin);
router.post('/', doctorController_1.doctorController.createDoctor.bind(doctorController_1.doctorController));
router.post('/with-schedule', doctorController_1.doctorController.createDoctorWithSchedule.bind(doctorController_1.doctorController));
router.put('/:id', doctorController_1.doctorController.updateDoctor.bind(doctorController_1.doctorController));
router.put('/:id/schedule', doctorController_1.doctorController.updateDoctorSchedule.bind(doctorController_1.doctorController));
router.delete('/:id', doctorController_1.doctorController.deleteDoctor.bind(doctorController_1.doctorController));
exports.default = router;
//# sourceMappingURL=doctorRoutes.js.map