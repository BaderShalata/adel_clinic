"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileController = exports.FileController = void 0;
const fileService_1 = require("../services/fileService");
class FileController {
    async createFile(req, res) {
        try {
            const data = req.body;
            const uploadedBy = req.user?.uid || '';
            const file = await fileService_1.fileService.createFile(data, uploadedBy);
            res.status(201).json(file);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getFileById(req, res) {
        try {
            const { id } = req.params;
            const file = await fileService_1.fileService.getFileById(id);
            if (!file) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            res.status(200).json(file);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAllFiles(req, res) {
        try {
            const { patientId, category } = req.query;
            const filters = {};
            if (patientId)
                filters.patientId = patientId;
            if (category)
                filters.category = category;
            const files = await fileService_1.fileService.getAllFiles(filters);
            res.status(200).json(files);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateFile(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const file = await fileService_1.fileService.updateFile(id, data);
            res.status(200).json(file);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deleteFile(req, res) {
        try {
            const { id } = req.params;
            await fileService_1.fileService.deleteFile(id);
            res.status(200).json({ message: 'File deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getFilesByPatient(req, res) {
        try {
            const { patientId } = req.params;
            const files = await fileService_1.fileService.getFilesByPatient(patientId);
            res.status(200).json(files);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.FileController = FileController;
exports.fileController = new FileController();
//# sourceMappingURL=fileController.js.map