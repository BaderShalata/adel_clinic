"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doctorController_1 = require("../controllers/doctorController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', doctorController_1.doctorController.getAllDoctors.bind(doctorController_1.doctorController));
router.get('/:id', doctorController_1.doctorController.getDoctorById.bind(doctorController_1.doctorController));
router.get('/specialty/:specialty', doctorController_1.doctorController.getDoctorsBySpecialty.bind(doctorController_1.doctorController));
router.use(auth_1.authorizeAdmin);
router.post('/', doctorController_1.doctorController.createDoctor.bind(doctorController_1.doctorController));
router.put('/:id', doctorController_1.doctorController.updateDoctor.bind(doctorController_1.doctorController));
router.delete('/:id', doctorController_1.doctorController.deleteDoctor.bind(doctorController_1.doctorController));
exports.default = router;
//# sourceMappingURL=doctorRoutes.js.map