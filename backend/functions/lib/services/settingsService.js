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
exports.settingsService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const SETTINGS_COLLECTION = 'settings';
const CLINIC_DOC = 'clinic';
class SettingsService {
    async getClinicStatus() {
        const doc = await db.collection(SETTINGS_COLLECTION).doc(CLINIC_DOC).get();
        if (!doc.exists) {
            return { isLocked: false };
        }
        const data = doc.data();
        return {
            isLocked: data.isLocked || false,
            lockedAt: data.lockedAt?.toDate?.()?.toISOString() || data.lockedAt,
            lockedBy: data.lockedBy,
            reason: data.reason,
        };
    }
    async setClinicLock(isLocked, adminUid, reason) {
        const data = {
            isLocked,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (isLocked) {
            data.lockedAt = admin.firestore.FieldValue.serverTimestamp();
            data.lockedBy = adminUid;
            if (reason)
                data.reason = reason;
        }
        else {
            data.lockedAt = null;
            data.lockedBy = null;
            data.reason = null;
        }
        await db.collection(SETTINGS_COLLECTION).doc(CLINIC_DOC).set(data, { merge: true });
        return this.getClinicStatus();
    }
}
exports.settingsService = new SettingsService();
//# sourceMappingURL=settingsService.js.map