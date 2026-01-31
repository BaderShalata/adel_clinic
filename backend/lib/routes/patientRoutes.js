"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patientController_1 = require("../controllers/patientController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.authorizeDoctorOrAdmin);
router.post('/', patientController_1.patientController.createPatient.bind(patientController_1.patientController));
router.get('/', patientController_1.patientController.getAllPatients.bind(patientController_1.patientController));
router.get('/stats', patientController_1.patientController.getPatientStats.bind(patientController_1.patientController));
router.get('/:id', patientController_1.patientController.getPatientById.bind(patientController_1.patientController));
router.put('/:id', patientController_1.patientController.updatePatient.bind(patientController_1.patientController));
router.delete('/:id', patientController_1.patientController.deletePatient.bind(patientController_1.patientController));
exports.default = router;
//# sourceMappingURL=patientRoutes.js.map