"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController_1 = require("../controllers/uploadController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All upload routes require authentication
router.use(auth_1.authenticate);
// Upload image (accepts base64 data)
router.post('/image', uploadController_1.uploadController.uploadImage.bind(uploadController_1.uploadController));
// Delete image
router.delete('/image', uploadController_1.uploadController.deleteImage.bind(uploadController_1.uploadController));
exports.default = router;
//# sourceMappingURL=uploadRoutes.js.map