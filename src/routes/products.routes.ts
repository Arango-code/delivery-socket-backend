import { Router } from "express";
import { productsController } from "../controllers/products.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tenantMiddleware, requireTenantContext } from "../middlewares/tenant.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
} from "../validators/product.schema";

const router = Router();
router.use(authMiddleware, tenantMiddleware, requireTenantContext);

router.get(
  "/",
  productsController.getProducts
);

router.get(
  "/:id",
  validate({ params: productIdParamSchema }),
  productsController.getProductById
);

router.post(
  "/",
  validate({ body: createProductSchema }),
  productsController.createProduct
);

router.put(
  "/:id",
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  productsController.updateProduct
);

router.patch(
  "/:id/availability",
  validate({ params: productIdParamSchema }),
  productsController.toggleAvailability
);

router.delete(
  "/:id",
  validate({ params: productIdParamSchema }),
  productsController.deleteProduct
);

export { router as productsRoutes };
