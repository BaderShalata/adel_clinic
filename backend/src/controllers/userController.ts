import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { CreateUserInput, UpdateUserInput } from '../models/User';

export class UserController {
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateUserInput = req.body;
      const user = await userService.createUser(data);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id as string);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.query;
      const users = await userService.getAllUsers(role as any);
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateUserInput = req.body;
      const user = await userService.updateUser(id as string, data);
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await userService.deleteUser(id as string);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await userService.deactivateUser(id as string);
      res.status(200).json({ message: 'User deactivated successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async activateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await userService.activateUser(id as string);
      res.status(200).json({ message: 'User activated successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const userController = new UserController();
