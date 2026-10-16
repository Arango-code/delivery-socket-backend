import { Request, Response, NextFunction } from "express";
import { categoriesService } from "../services/categories.service";

export class CategoriesController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.getCategories(req.restaurantId!);
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.createCategory(req.restaurantId!, req.body);
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = Number(req.params.id);
      const category = await categoriesService.updateCategory(
        categoryId,
        req.restaurantId!,
        req.body
      );
      res.json(category);
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = Number(req.params.id);
      const result = await categoriesService.deleteCategory(categoryId, req.restaurantId!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const categoriesController = new CategoriesController();
