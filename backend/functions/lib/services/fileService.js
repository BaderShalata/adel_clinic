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
exports.fileService = exports.FileService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class FileService {
    constructor() {
        this.filesCollection = db.collection('files');
    }
    async createFile(data, uploadedBy) {
        try {
            const fileData = {
                fileName: data.fileName,
                fileURL: data.fileURL,
                fileType: data.fileType,
                fileSize: data.fileSize,
                uploadedBy,
                patientId: data.patientId,
                category: data.category,
                description: data.description,
                uploadedAt: admin.firestore.Timestamp.now(),
            };
            const docRef = await this.filesCollection.add(fileData);
            return {
                id: docRef.id,
                ...fileData,
            };
        }
        catch (error) {
            throw new Error(`Failed to create file record: ${error.message}`);
        }
    }
    async getFileById(id) {
        try {
            const doc = await this.filesCollection.doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            throw new Error(`Failed to get file: ${error.message}`);
        }
    }
    async getAllFiles(filters) {
        try {
            let query = this.filesCollection.orderBy('uploadedAt', 'desc');
            if (filters?.patientId) {
                query = query.where('patientId', '==', filters.patientId);
            }
            if (filters?.category) {
                query = query.where('category', '==', filters.category);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            throw new Error(`Failed to get files: ${error.message}`);
        }
    }
    async updateFile(id, data) {
        try {
            await this.filesCollection.doc(id).update(data);
            const updatedFile = await this.getFileById(id);
            if (!updatedFile) {
                throw new Error('File not found after update');
            }
            return updatedFile;
        }
        catch (error) {
            throw new Error(`Failed to update file: ${error.message}`);
        }
    }
    async deleteFile(id) {
        try {
            // Get file document to get the fileURL for storage deletion
            const fileDoc = await this.getFileById(id);
            if (!fileDoc) {
                throw new Error('File not found');
            }
            // Delete from Firestore
            await this.filesCollection.doc(id).delete();
            // Optionally delete from Firebase Storage if using Storage
            // const bucket = admin.storage().bucket();
            // await bucket.file(fileDoc.fileURL).delete();
        }
        catch (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
    async getFilesByPatient(patientId) {
        try {
            const snapshot = await this.filesCollection
                .where('patientId', '==', patientId)
                .orderBy('uploadedAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            throw new Error(`Failed to get patient files: ${error.message}`);
        }
    }
}
exports.FileService = FileService;
exports.fileService = new FileService();
//# sourceMappingURL=fileService.js.map