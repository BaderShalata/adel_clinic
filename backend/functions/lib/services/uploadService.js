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
exports.uploadService = exports.UploadService = void 0;
const admin = __importStar(require("firebase-admin"));
const uuid_1 = require("uuid");
// Use the specific Firebase Storage bucket
const bucket = admin.storage().bucket('adelclinic-35393.firebasestorage.app');
class UploadService {
    /**
     * Upload a file from base64 data to Firebase Storage
     * @param base64Data Base64 encoded file data (without the data:... prefix)
     * @param fileName Original file name
     * @param folder Folder to store the file in (e.g., 'news', 'doctors')
     * @param mimeType MIME type of the file
     */
    async uploadBase64(base64Data, fileName, folder, mimeType) {
        try {
            // Generate unique file name
            const extension = this.getExtensionFromMimeType(mimeType) || fileName.split('.').pop() || 'jpg';
            const uniqueFileName = `${(0, uuid_1.v4)()}.${extension}`;
            const filePath = `${folder}/${uniqueFileName}`;
            // Convert base64 to buffer
            const buffer = Buffer.from(base64Data, 'base64');
            // Create file reference
            const file = bucket.file(filePath);
            // Upload the file
            await file.save(buffer, {
                metadata: {
                    contentType: mimeType,
                    metadata: {
                        firebaseStorageDownloadTokens: (0, uuid_1.v4)(),
                    },
                },
            });
            // Make the file publicly accessible
            await file.makePublic();
            // Get the public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            return {
                url: publicUrl,
                path: filePath,
                fileName: uniqueFileName,
            };
        }
        catch (error) {
            console.error('Upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }
    /**
     * Delete a file from Firebase Storage
     * @param filePath Path to the file in storage
     */
    async deleteFile(filePath) {
        try {
            await bucket.file(filePath).delete();
        }
        catch (error) {
            // Ignore "not found" errors
            if (error.code !== 404) {
                throw new Error(`Failed to delete file: ${error.message}`);
            }
        }
    }
    getExtensionFromMimeType(mimeType) {
        const mimeToExt = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
        };
        return mimeToExt[mimeType] || null;
    }
}
exports.UploadService = UploadService;
exports.uploadService = new UploadService();
//# sourceMappingURL=uploadService.js.map