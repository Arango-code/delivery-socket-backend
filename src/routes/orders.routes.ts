import { Router } from "express";
import { ordersController } from "../controllers/orders.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { validate } from "../middlewares/validate.middleware";
import { webhookMiddleware } from "../middlewares/webhook.middleware";
import {
  createOrderSchema,
  updateStatusSchema,
  updateDeliveryFeeSchema,
  confirmOrderSchema,
  orderIdParamSchema,
} from "../validators/order.schema";

const router = Router();

router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  ordersController.getOrders
);

router.get(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  validate({ params: orderIdParamSchema }),
  ordersController.getOrderById
);

router.post(
  "/",
  webhookMiddleware,
  validate({ body: createOrderSchema }),
  ordersController.createOrder
);

router.put(
  "/:id/status",
  authMiddleware,
  tenantMiddleware,
  validate({ params: orderIdParamSchema, body: updateStatusSchema }),
  ordersController.updateStatus
);

router.put(
  "/:id/delivery-fee",
  authMiddleware,
  tenantMiddleware,
  validate({ params: orderIdParamSchema, body: updateDeliveryFeeSchema }),
  ordersController.updateDeliveryFee
);

router.put(
  "/:id/confirm",
  validate({ params: orderIdParamSchema, body: confirmOrderSchema }),
  ordersController.confirmOrder
);

export { router as ordersRoutes };
