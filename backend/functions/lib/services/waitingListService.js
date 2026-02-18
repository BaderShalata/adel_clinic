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
exports.waitingListService = exports.WaitingListService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class WaitingListService {
    constructor() {
        this.waitingListCollection = db.collection('waitingList');
        this.patientsCollection = db.collection('patients');
        this.doctorsCollection = db.collection('doctors');
    }
    async addToWaitingList(data, createdBy) {
        try {
            // Fetch patient and doctor details
            const [patientDoc, doctorDoc] = await Promise.all([
                this.patientsCollection.doc(data.patientId).get(),
                this.doctorsCollection.doc(data.doctorId).get(),
            ]);
            if (!patientDoc.exists) {
                throw new Error('Patient not found');
            }
            if (!doctorDoc.exists) {
                throw new Error('Doctor not found');
            }
            const patient = patientDoc.data();
            const doctor = doctorDoc.data();
            // Get the next priority number for this doctor
            // Use simple query to avoid needing composite index
            const existingEntries = await this.waitingListCollection
                .where('doctorId', '==', data.doctorId)
                .where('status', '==', 'waiting')
                .get();
            const maxPriority = existingEntries.docs.reduce((max, doc) => {
                const priority = doc.data().priority || 0;
                return priority > max ? priority : max;
            }, 0);
            const entryData = {
                patientId: data.patientId,
                patientName: patient?.fullName || '',
                doctorId: data.doctorId,
                doctorName: doctor?.fullName || '',
                serviceType: data.serviceType,
                preferredDate: data.preferredDate instanceof Date
                    ? admin.firestore.Timestamp.fromDate(data.preferredDate)
                    : data.preferredDate,
                status: 'waiting',
                priority: data.priority ?? (maxPriority + 1),
                notes: data.notes,
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
                createdBy,
            };
            const docRef = await this.waitingListCollection.add(entryData);
            return {
                id: docRef.id,
                ...entryData,
            };
        }
        catch (error) {
            throw new Error(`Failed to add to waiting list: ${error.message}`);
        }
    }
    async getWaitingListById(id) {
        try {
            const doc = await this.waitingListCollection.doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get waiting list entry: ${error.message}`);
        }
    }
    async getWaitingList(filters) {
        try {
            // Use simple query to avoid needing composite index
            // Filter in memory instead
            const snapshot = await this.waitingListCollection.get();
            let entries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Auto-move past waiting entries to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
            for (const entry of entries) {
                if (entry.status === 'waiting' && entry.preferredDate) {
                    let entryDate;
                    const dateVal = entry.preferredDate;
                    if (typeof dateVal.toDate === 'function') {
                        entryDate = dateVal.toDate();
                    }
                    else if (typeof dateVal._seconds === 'number') {
                        entryDate = new Date(dateVal._seconds * 1000);
                    }
                    else {
                        continue;
                    }
                    entryDate.setHours(0, 0, 0, 0);
                    // If the preferred date is in the past, update it to today
                    if (entryDate < today) {
                        try {
                            await this.waitingListCollection.doc(entry.id).update({
                                preferredDate: todayTimestamp,
                                updatedAt: admin.firestore.Timestamp.now(),
                            });
                            // Update the local entry too
                            entry.preferredDate = todayTimestamp;
                        }
                        catch (e) {
                            console.error(`Failed to auto-move waiting list entry ${entry.id} to today:`, e);
                        }
                    }
                }
            }
            // Apply filters in memory
            if (filters?.doctorId) {
                entries = entries.filter(e => e.doctorId === filters.doctorId);
            }
            if (filters?.patientId) {
                entries = entries.filter(e => e.patientId === filters.patientId);
            }
            if (filters?.status) {
                entries = entries.filter(e => e.status === filters.status);
            }
            if (filters?.date) {
                const dateStr = filters.date.toISOString().split('T')[0];
                entries = entries.filter(e => {
                    const entryDate = e.preferredDate.toDate();
                    const entryDateStr = entryDate.toISOString().split('T')[0];
                    return entryDateStr === dateStr;
                });
            }
            // Sort by preferredDate then priority
            entries.sort((a, b) => {
                const dateA = a.preferredDate.toDate().getTime();
                const dateB = b.preferredDate.toDate().getTime();
                if (dateA !== dateB)
                    return dateA - dateB;
                return (a.priority || 0) - (b.priority || 0);
            });
            return entries;
        }
        catch (error) {
            throw new Error(`Failed to get waiting list: ${error.message}`);
        }
    }
    async updateWaitingListEntry(id, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: admin.firestore.Timestamp.now(),
            };
            if (data.preferredDate && data.preferredDate instanceof Date) {
                updateData.preferredDate = admin.firestore.Timestamp.fromDate(data.preferredDate);
            }
            await this.waitingListCollection.doc(id).update(updateData);
            const updatedEntry = await this.getWaitingListById(id);
            if (!updatedEntry) {
                throw new Error('Waiting list entry not found after update');
            }
            return updatedEntry;
        }
        catch (error) {
            throw new Error(`Failed to update waiting list entry: ${error.message}`);
        }
    }
    async removeFromWaitingList(id) {
        try {
            await this.waitingListCollection.doc(id).delete();
        }
        catch (error) {
            throw new Error(`Failed to remove from waiting list: ${error.message}`);
        }
    }
    async bookFromWaitingList(id, appointmentDate, appointmentTime, createdBy) {
        try {
            const entry = await this.getWaitingListById(id);
            if (!entry) {
                throw new Error('Waiting list entry not found');
            }
            if (entry.status !== 'waiting') {
                throw new Error('This waiting list entry is no longer active');
            }
            // Import appointmentService to create the appointment
            const { appointmentService } = await Promise.resolve().then(() => __importStar(require('./appointmentService')));
            // Create the appointment with the provided date
            // Waiting list bookings are done by admins
            const appointment = await appointmentService.createAppointment({
                patientId: entry.patientId,
                doctorId: entry.doctorId,
                appointmentDate,
                appointmentTime,
                serviceType: entry.serviceType,
                duration: 15, // Default duration
                notes: entry.notes,
            }, createdBy, 'admin');
            // Delete the waiting list entry after successful booking
            await this.removeFromWaitingList(id);
            return appointment;
        }
        catch (error) {
            throw new Error(`Failed to book from waiting list: ${error.message}`);
        }
    }
}
exports.WaitingListService = WaitingListService;
exports.waitingListService = new WaitingListService();
//# sourceMappingURL=waitingListService.js.map