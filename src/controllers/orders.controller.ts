import { Request, Response, NextFunction } from "express";
import { ordersService } from "../services/orders.service";

export class OrdersController {
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await ordersService.getOrders(req.restaurantId);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.id);
      const order = await ordersService.getOrderById(orderId, req.restaurantId);
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.createOrder(req.body);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.id);
      const { newStatus } = req.body;
      const order = await ordersService.updateStatus(
        orderId,
        newStatus,
        req.restaurantId
      );
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  async updateDeliveryFee(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.id);
      const { delivery_fee } = req.body;
      const order = await ordersService.updateDeliveryFee(
        orderId,
        delivery_fee,
        req.restaurantId
      );
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  async confirmOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.id);
      const { action, confirmation_token } = req.body;
      const order = await ordersService.confirmOrder(orderId, action, confirmation_token);
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
}

export const ordersController = new OrdersController();
