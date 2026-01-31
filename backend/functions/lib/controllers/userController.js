"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const userService_1 = require("../services/userService");
class UserController {
    async createUser(req, res) {
        try {
            const data = req.body;
            const user = await userService_1.userService.createUser(data);
            res.status(201).json(user);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await userService_1.userService.getUserById(id);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.status(200).json(user);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAllUsers(req, res) {
        try {
            const { role } = req.query;
            const users = await userService_1.userService.getAllUsers(role);
            res.status(200).json(users);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const user = await userService_1.userService.updateUser(id, data);
            res.status(200).json(user);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            await userService_1.userService.deleteUser(id);
            res.status(200).json({ message: 'User deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deactivateUser(req, res) {
        try {
            const { id } = req.params;
            await userService_1.userService.deactivateUser(id);
            res.status(200).json({ message: 'User deactivated successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async activateUser(req, res) {
        try {
            const { id } = req.params;
            await userService_1.userService.activateUser(id);
            res.status(200).json({ message: 'User activated successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=userController.js.map