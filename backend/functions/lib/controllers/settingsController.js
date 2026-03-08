"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const settingsService_1 = require("../services/settingsService");
class SettingsController {
    async getClinicStatus(_req, res) {
        try {
            const status = await settingsService_1.settingsService.getClinicStatus();
            res.status(200).json(status);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async setClinicLock(req, res) {
        try {
            const { isLocked, reason } = req.body;
            const adminUid = req.user?.uid || '';
            const status = await settingsService_1.settingsService.setClinicLock(isLocked, adminUid, reason);
            res.status(200).json(status);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
//# sourceMappingURL=settingsController.js.map