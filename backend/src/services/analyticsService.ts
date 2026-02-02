import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface AnalyticsData {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  recentPatients: number;
  appointmentsByStatus: {
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  appointmentsByDoctor: Array<{
    doctorId: string;
    doctorName: string;
    count: number;
  }>;
}

export class AnalyticsService {
  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const now = admin.firestore.Timestamp.now();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get counts
      const [
        patientsSnapshot,
        doctorsSnapshot,
        appointmentsSnapshot,
        todayAppointmentsSnapshot,
        upcomingAppointmentsSnapshot,
        completedAppointmentsSnapshot,
        cancelledAppointmentsSnapshot,
      ] = await Promise.all([
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
        if (status === 'scheduled') appointmentsByStatus.scheduled++;
        else if (status === 'completed') appointmentsByStatus.completed++;
        else if (status === 'cancelled') appointmentsByStatus.cancelled++;
        else if (status === 'no-show') appointmentsByStatus.noShow++;
      });

      // Count appointments by doctor
      const doctorAppointmentMap = new Map<string, { name: string; count: number }>();
      appointmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const existing = doctorAppointmentMap.get(data.doctorId);
        if (existing) {
          existing.count++;
        } else {
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
    } catch (error: any) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  async getAppointmentTrends(days: number = 30): Promise<Array<{
    date: string;
    count: number;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const snapshot = await db.collection('appointments')
        .where('appointmentDate', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .get();

      const trendMap = new Map<string, number>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Handle different date formats
        let date: Date;
        const dateVal = data.appointmentDate as any;
        if (typeof dateVal.toDate === 'function') {
          date = dateVal.toDate();
        } else if (typeof dateVal._seconds === 'number') {
          date = new Date(dateVal._seconds * 1000);
        } else if (typeof dateVal === 'string') {
          date = new Date(dateVal);
        } else {
          return;
        }
        const dateStr = date.toISOString().split('T')[0];
        trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
      });

      const trends = Array.from(trendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trends;
    } catch (error: any) {
      throw new Error(`Failed to get appointment trends: ${error.message}`);
    }
  }
}

export const analyticsService = new AnalyticsService();
