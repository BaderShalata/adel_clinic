import * as admin from 'firebase-admin';

const db = admin.firestore();
const SETTINGS_COLLECTION = 'settings';
const CLINIC_DOC = 'clinic';

export interface ClinicStatus {
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  reason?: string;
}

class SettingsService {
  async getClinicStatus(): Promise<ClinicStatus> {
    const doc = await db.collection(SETTINGS_COLLECTION).doc(CLINIC_DOC).get();
    if (!doc.exists) {
      return { isLocked: false };
    }
    const data = doc.data()!;
    return {
      isLocked: data.isLocked || false,
      lockedAt: data.lockedAt?.toDate?.()?.toISOString() || data.lockedAt,
      lockedBy: data.lockedBy,
      reason: data.reason,
    };
  }

  async setClinicLock(isLocked: boolean, adminUid: string, reason?: string): Promise<ClinicStatus> {
    const data: any = {
      isLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (isLocked) {
      data.lockedAt = admin.firestore.FieldValue.serverTimestamp();
      data.lockedBy = adminUid;
      if (reason) data.reason = reason;
    } else {
      data.lockedAt = null;
      data.lockedBy = null;
      data.reason = null;
    }

    await db.collection(SETTINGS_COLLECTION).doc(CLINIC_DOC).set(data, { merge: true });
    return this.getClinicStatus();
  }
}

export const settingsService = new SettingsService();
