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
exports.lockedSlotService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const lockedSlotsCollection = db.collection('lockedSlots');
// Helper to convert Firestore date to JS Date
const toDate = (dateVal) => {
    if (dateVal instanceof admin.firestore.Timestamp) {
        return dateVal.toDate();
    }
    if (typeof dateVal?.toDate === 'function') {
        return dateVal.toDate();
    }
    if (typeof dateVal?._seconds === 'number') {
        return new Date(dateVal._seconds * 1000);
    }
    return new Date(dateVal);
};
exports.lockedSlotService = {
    /**
     * Create a new locked slot
     */
    async createLockedSlot(data, createdBy) {
        // Check if slot is already locked
        const existingLock = await this.getLockedSlot(data.doctorId, data.date, data.time);
        if (existingLock) {
            throw new Error('This slot is already locked');
        }
        const docRef = lockedSlotsCollection.doc();
        const lockedSlot = {
            id: docRef.id,
            doctorId: data.doctorId,
            date: admin.firestore.Timestamp.fromDate(new Date(data.date)),
            time: data.time,
            reason: data.reason || 'Admin locked',
            createdAt: admin.firestore.Timestamp.now(),
            createdBy,
        };
        await docRef.set(lockedSlot);
        return lockedSlot;
    },
    /**
     * Get a specific locked slot - uses simple query + memory filter to avoid composite index
     */
    async getLockedSlot(doctorId, date, time) {
        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);
        // Simple query by doctorId only, filter in memory
        const snapshot = await lockedSlotsCollection
            .where('doctorId', '==', doctorId)
            .get();
        const match = snapshot.docs.find(doc => {
            const data = doc.data();
            if (data.time !== time)
                return false;
            const slotDate = toDate(data.date);
            return slotDate >= dateStart && slotDate <= dateEnd;
        });
        return match ? match.data() : null;
    },
    /**
     * Check if a specific slot is locked
     */
    async isSlotLocked(doctorId, date, time) {
        const lockedSlot = await this.getLockedSlot(doctorId, date, time);
        return lockedSlot !== null;
    },
    /**
     * Get all locked slots for a doctor on a specific date - uses simple query + memory filter
     */
    async getLockedSlotsByDate(doctorId, date) {
        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);
        // Simple query by doctorId only, filter date in memory
        const snapshot = await lockedSlotsCollection
            .where('doctorId', '==', doctorId)
            .get();
        return snapshot.docs
            .map(doc => doc.data())
            .filter(slot => {
            const slotDate = toDate(slot.date);
            return slotDate >= dateStart && slotDate <= dateEnd;
        });
    },
    /**
     * Get all locked slots for a doctor
     */
    async getLockedSlotsByDoctor(doctorId) {
        const snapshot = await lockedSlotsCollection
            .where('doctorId', '==', doctorId)
            .get();
        // Sort in memory instead of using orderBy to avoid index
        return snapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => {
            const dateA = toDate(a.date);
            const dateB = toDate(b.date);
            return dateB.getTime() - dateA.getTime();
        });
    },
    /**
     * Delete a locked slot by ID
     */
    async deleteLockedSlot(id) {
        await lockedSlotsCollection.doc(id).delete();
    },
    /**
     * Delete a locked slot by details (doctorId, date, time) - uses simple query + memory filter
     */
    async deleteLockedSlotByDetails(doctorId, date, time) {
        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);
        // Simple query by doctorId only, filter in memory
        const snapshot = await lockedSlotsCollection
            .where('doctorId', '==', doctorId)
            .get();
        const docsToDelete = snapshot.docs.filter(doc => {
            const data = doc.data();
            if (data.time !== time)
                return false;
            const slotDate = toDate(data.date);
            return slotDate >= dateStart && slotDate <= dateEnd;
        });
        if (docsToDelete.length === 0) {
            return false;
        }
        const batch = db.batch();
        docsToDelete.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        return true;
    },
};
//# sourceMappingURL=lockedSlotService.js.map