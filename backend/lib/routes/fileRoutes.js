"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileController_1 = require("../controllers/fileController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.authorizeDoctorOrAdmin);
router.post('/', fileController_1.fileController.createFile.bind(fileController_1.fileController));
router.get('/', fileController_1.fileController.getAllFiles.bind(fileController_1.fileController));
router.get('/patient/:patientId', fileController_1.fileController.getFilesByPatient.bind(fileController_1.fileController));
router.get('/:id', fileController_1.fileController.getFileById.bind(fileController_1.fileController));
router.put('/:id', fileController_1.fileController.updateFile.bind(fileController_1.fileController));
router.delete('/:id', fileController_1.fileController.deleteFile.bind(fileController_1.fileController));
exports.default = router;
//# sourceMappingURL=fileRoutes.js.map