"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class AnalyticsService {
    async getAnalytics() {
        try {
            const now = admin.firestore.Timestamp.now();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            // Get counts
            const [patientsSnapshot, doctorsSnapshot, appointmentsSnapshot, todayAppointmentsSnapshot, upcomingAppointmentsSnapshot, completedAppointmentsSnapshot, cancelledAppointmentsSnapshot,] = await Promise.all([
                db.collection('patients').get(),
                db.collection('doctors').where('isActive', '==', true).get(),
                db.collection('appointments').get(),
                db.collection('appointments')
                    .where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(today))
                    .where('appointmentDate', '<', admin.firestore.Timestamp.fromDate(tomorrow))
                    .get(),
                db.collection('appointments')
                    .where('appointmentDate', '>', now)
                    .where('status', '==', 'scheduled')
                    .get(),
                db.collection('appointments')
                    .where('status', '==', 'completed')
                    .get(),
                db.collection('appointments')
                    .where('status', '==', 'cancelled')
                    .get(),
            ]);
            // Get recent patients (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentPatientsSnapshot = await db.collection('patients')
                .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
                .get();
            // Count appointments by status
            const appointmentsByStatus = {
                scheduled: 0,
                completed: 0,
                cancelled: 0,
                noShow: 0,
            };
            appointmentsSnapshot.docs.forEach(doc => {
                const status = doc.data().status;
                if (status === 'scheduled')
                    appointmentsByStatus.scheduled++;
                else if (status === 'completed')
                    appointmentsByStatus.completed++;
                else if (status === 'cancelled')
                    appointmentsByStatus.cancelled++;
                else if (status === 'no-show')
                    appointmentsByStatus.noShow++;
            });
            // Count appointments by doctor
            const doctorAppointmentMap = new Map();
            appointmentsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const existing = doctorAppointmentMap.get(data.doctorId);
                if (existing) {
                    existing.count++;
                }
                else {
                    doctorAppointmentMap.set(data.doctorId, {
                        name: data.doctorName,
                        count: 1,
                    });
                }
            });
            const appointmentsByDoctor = Array.from(doctorAppointmentMap.entries()).map(([doctorId, data]) => ({
                doctorId,
                doctorName: data.name,
                count: data.count,
            })).sort((a, b) => b.count - a.count);
            return {
                totalPatients: patientsSnapshot.size,
                totalDoctors: doctorsSnapshot.size,
                totalAppointments: appointmentsSnapshot.size,
                todayAppointments: todayAppointmentsSnapshot.size,
                upcomingAppointments: upcomingAppointmentsSnapshot.size,
                completedAppointments: completedAppointmentsSnapshot.size,
                cancelledAppointments: cancelledAppointmentsSnapshot.size,
                recentPatients: recentPatientsSnapshot.size,
                appointmentsByStatus,
                appointmentsByDoctor,
            };
        }
        catch (error) {
            throw new Error(`Failed to get analytics: ${error.message}`);
        }
    }
    async getAppointmentTrends(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);
            const snapshot = await db.collection('appointments')
                .where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(startDate))
                .get();
            const trendMap = new Map();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const date = data.appointmentDate.toDate();
                const dateStr = date.toISOString().split('T')[0];
                trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
            });
            const trends = Array.from(trendMap.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));
            return trends;
        }
        catch (error) {
            throw new Error(`Failed to get appointment trends: ${error.message}`);
        }
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analyticsService.js.map