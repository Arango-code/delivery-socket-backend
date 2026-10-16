import { Request, Response, NextFunction } from "express";
import { restaurantsService } from "../services/restaurants.service";

export class RestaurantsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurants = await restaurantsService.getAll();
      res.json(restaurants);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = Number(req.params.id);
      const restaurant = await restaurantsService.getById(restaurantId);
      res.json(restaurant);
    } catch (err) {
      next(err);
    }
  }

  async getByName(req: Request, res: Response, next: NextFunction) {
    try {
      const name = req.query.name as string;
      if (!name) {
        res.status(400).json({ error: "Parámetro 'name' requerido" });
        return;
      }
      const restaurant = await restaurantsService.getByName(name);
      res.json({ exists: true, restaurant });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurant = await restaurantsService.create(req.body);
      res.status(201).json(restaurant);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = Number(req.params.id);
      const restaurant = await restaurantsService.update(restaurantId, req.body);
      res.json(restaurant);
    } catch (err) {
      next(err);
    }
  }
}

export const restaurantsController = new RestaurantsController();
