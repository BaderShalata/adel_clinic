"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analyticsService_1 = require("../services/analyticsService");
class AnalyticsController {
    async getAnalytics(req, res) {
        try {
            const analytics = await analyticsService_1.analyticsService.getAnalytics();
            res.status(200).json(analytics);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAppointmentTrends(req, res) {
        try {
            const { days } = req.query;
            const trends = await analyticsService_1.analyticsService.getAppointmentTrends(days ? parseInt(days) : 30);
            res.status(200).json(trends);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
//# sourceMappingURL=analyticsController.js.map