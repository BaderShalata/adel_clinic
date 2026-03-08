import * as admin from 'firebase-admin';

const db = admin.firestore();

interface NotificationTranslations {
  title: string;
  body: string;
}

type TranslationKey = 'appointmentConfirmed' | 'appointmentCancelled' | 'appointmentReminder';

const translations: Record<string, Record<TranslationKey, NotificationTranslations>> = {
  en: {
    appointmentConfirmed: {
      title: 'SBA REHANA',
      body: 'Your appointment has been confirmed for {date} at {time}. We look forward to seeing you!',
    },
    appointmentCancelled: {
      title: 'SBA REHANA',
      body: 'Your appointment on {date} has been cancelled. Please contact us for rescheduling.',
    },
    appointmentReminder: {
      title: 'SBA REHANA',
      body: 'Reminder: You have an appointment tomorrow at {time} with {doctorName}.',
    },
  },
  ar: {
    appointmentConfirmed: {
      title: 'صبا ريحانا ',
      body: 'تم تأكيد موعدك بتاريخ {date} الساعة {time}. نتطلع لرؤيتك!',
    },
    appointmentCancelled: {
      title: 'صبا ريحانا ',
      body: 'تم إلغاء موعدك بتاريخ {date}. يرجى الاتصال بنا لإعادة الجدولة.',
    },
    appointmentReminder: {
      title: 'صبا ريحانا',
      body: 'تذكير: لديك موعد غداً الساعة {time} مع {doctorName}.',
    },
  },
  he: {
    appointmentConfirmed: {
      title: 'סבא ריחאנה',
      body: 'התור שלך אושר לתאריך {date} בשעה {time}. מצפים לראותך!',
    },
    appointmentCancelled: {
      title: 'סבא ריחאנה',
      body: 'התור שלך בתאריך {date} בוטל. אנא צור קשר לתיאום מחדש.',
    },
    appointmentReminder: {
      title: 'סבא ריחאנה',
      body: 'תזכורת: יש לך תור מחר בשעה {time} אצל {doctorName}.',
    },
  },
};

function getTranslation(locale: string, key: TranslationKey): NotificationTranslations {
  return translations[locale]?.[key] || translations['he'][key];
}

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

export class NotificationService {
  /**
   * Send notification when appointment is confirmed (scheduled)
   */
  async sendAppointmentConfirmed(patientUid: string, date: string, time: string): Promise<void> {
    try {
      const { fcmToken, locale } = await this.getUserTokenAndLocale(patientUid);
      if (!fcmToken) {
        console.warn(`No FCM token found for user ${patientUid}, skipping confirmed notification`);
        return;
      }

      const t = getTranslation(locale, 'appointmentConfirmed');
      await this.sendNotification(fcmToken, patientUid, {
        title: t.title,
        body: interpolate(t.body, { date, time }),
      });
    } catch (error) {
      console.error('Failed to send appointment confirmed notification:', error);
    }
  }

  /**
   * Send notification when appointment is cancelled
   */
  async sendAppointmentCancelled(patientUid: string, date: string): Promise<void> {
    try {
      const { fcmToken, locale } = await this.getUserTokenAndLocale(patientUid);
      if (!fcmToken) {
        console.warn(`No FCM token found for user ${patientUid}, skipping cancelled notification`);
        return;
      }

      const t = getTranslation(locale, 'appointmentCancelled');
      await this.sendNotification(fcmToken, patientUid, {
        title: t.title,
        body: interpolate(t.body, { date }),
      });
    } catch (error) {
      console.error('Failed to send appointment cancelled notification:', error);
    }
  }

  /**
   * Send 24h reminder notification
   */
  async sendAppointmentReminder(patientUid: string, time: string, doctorName: string): Promise<void> {
    try {
      const { fcmToken, locale } = await this.getUserTokenAndLocale(patientUid);
      if (!fcmToken) return;

      const t = getTranslation(locale, 'appointmentReminder');
      await this.sendNotification(fcmToken, patientUid, {
        title: t.title,
        body: interpolate(t.body, { time, doctorName }),
      });
    } catch (error) {
      console.error('Failed to send appointment reminder notification:', error);
    }
  }

  /**
   * Get FCM token and locale preference for a user
   */
  private async getUserTokenAndLocale(uid: string): Promise<{ fcmToken: string | null; locale: string }> {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return { fcmToken: null, locale: 'he' };

    const data = userDoc.data();
    return {
      fcmToken: data?.fcmToken || null,
      locale: data?.locale || 'he',
    };
  }

  /**
   * Send FCM notification and auto-clean invalid tokens
   */
  private async sendNotification(
    token: string,
    uid: string,
    notification: { title: string; body: string },
  ): Promise<void> {
    try {
      await admin.messaging().send({
        token,
        notification,
        android: {
          notification: {
            channelId: 'appointment_notifications',
            priority: 'high',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1,
              'mutable-content': 1,
            },
          },
        },
      });
      console.log(`Notification sent to user ${uid}`);
    } catch (error: any) {
      // Auto-clean invalid/expired tokens
      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token'
      ) {
        console.log(`Removing invalid FCM token for user ${uid}`);
        await db.collection('users').doc(uid).update({ fcmToken: admin.firestore.FieldValue.delete() });
      } else {
        throw error;
      }
    }
  }
}

export const notificationService = new NotificationService();
