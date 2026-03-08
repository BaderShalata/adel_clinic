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
exports.notificationService = exports.NotificationService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const translations = {
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
            title: '\u200Fصبا ريحانا',
            body: '\u200Fتم تأكيد موعدك بتاريخ {date} الساعة {time}. نتطلع لرؤيتك!',
        },
        appointmentCancelled: {
            title: '\u200Fصبا ريحانا',
            body: '\u200Fتم إلغاء موعدك بتاريخ {date}. يرجى الاتصال بنا لإعادة الجدولة.',
        },
        appointmentReminder: {
            title: '\u200Fصبا ريحانا',
            body: '\u200Fتذكير: لديك موعد غداً الساعة {time} مع {doctorName}.',
        },
    },
    he: {
        appointmentConfirmed: {
            title: '\u200Fסבא ריחאנה',
            body: '\u200Fהתור שלך אושר לתאריך {date} בשעה {time}. מצפים לראותך!',
        },
        appointmentCancelled: {
            title: '\u200Fסבא ריחאנה',
            body: '\u200Fהתור שלך בתאריך {date} בוטל. אנא צור קשר לתיאום מחדש.',
        },
        appointmentReminder: {
            title: '\u200Fסבא ריחאנה',
            body: '\u200Fתזכורת: יש לך תור מחר בשעה {time} אצל {doctorName}.',
        },
    },
};
function getTranslation(locale, key) {
    return translations[locale]?.[key] || translations['he'][key];
}
function interpolate(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
}
class NotificationService {
    /**
     * Send notification when appointment is confirmed (scheduled)
     */
    async sendAppointmentConfirmed(patientUid, date, time) {
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
        }
        catch (error) {
            console.error('Failed to send appointment confirmed notification:', error);
        }
    }
    /**
     * Send notification when appointment is cancelled
     */
    async sendAppointmentCancelled(patientUid, date) {
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
        }
        catch (error) {
            console.error('Failed to send appointment cancelled notification:', error);
        }
    }
    /**
     * Send 24h reminder notification
     */
    async sendAppointmentReminder(patientUid, time, doctorName) {
        try {
            const { fcmToken, locale } = await this.getUserTokenAndLocale(patientUid);
            if (!fcmToken)
                return;
            const t = getTranslation(locale, 'appointmentReminder');
            await this.sendNotification(fcmToken, patientUid, {
                title: t.title,
                body: interpolate(t.body, { time, doctorName }),
            });
        }
        catch (error) {
            console.error('Failed to send appointment reminder notification:', error);
        }
    }
    /**
     * Get FCM token and locale preference for a user
     */
    async getUserTokenAndLocale(uid) {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists)
            return { fcmToken: null, locale: 'he' };
        const data = userDoc.data();
        return {
            fcmToken: data?.fcmToken || null,
            locale: data?.locale || 'he',
        };
    }
    /**
     * Send FCM notification and auto-clean invalid tokens
     */
    async sendNotification(token, uid, notification) {
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
        }
        catch (error) {
            // Auto-clean invalid/expired tokens
            if (error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-registration-token') {
                console.log(`Removing invalid FCM token for user ${uid}`);
                await db.collection('users').doc(uid).update({ fcmToken: admin.firestore.FieldValue.delete() });
            }
            else {
                throw error;
            }
        }
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notificationService.js.map