import { Request, Response, NextFunction } from "express";
import { usersService } from "../services/users.service";

export class UsersController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await usersService.getAll();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async getByRestaurant(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await usersService.getByRestaurant(req.restaurantId!);
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.params.id);
      const user = await usersService.update(userId, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.params.id);
      const user = await usersService.toggleActive(userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
