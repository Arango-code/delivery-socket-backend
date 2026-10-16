import { Request, Response, NextFunction } from "express";
import { productsService } from "../services/products.service";

export class ProductsController {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
        available: req.query.available !== undefined ? req.query.available === "true" : undefined,
        search: req.query.search as string | undefined,
      };
      const products = await productsService.getProducts(req.restaurantId!, filters);
      res.json(products);
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.id);
      const product = await productsService.getProductById(productId, req.restaurantId!);
      res.json(product);
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.createProduct(req.restaurantId!, req.body);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.id);
      const product = await productsService.updateProduct(
        productId,
        req.restaurantId!,
        req.body
      );
      res.json(product);
    } catch (err) {
      next(err);
    }
  }

  async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.id);
      const product = await productsService.toggleAvailability(productId, req.restaurantId!);
      res.json(product);
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.id);
      const result = await productsService.deleteProduct(productId, req.restaurantId!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const productsController = new ProductsController();
