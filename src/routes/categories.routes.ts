import { Router } from "express";
import { categoriesController } from "../controllers/categories.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tenantMiddleware, requireTenantContext } from "../middlewares/tenant.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from "../validators/category.schema";

const router = Router();
router.use(authMiddleware, tenantMiddleware, requireTenantContext);

router.get(
  "/",
  categoriesController.getCategories
);

router.post(
  "/",
  validate({ body: createCategorySchema }),
  categoriesController.createCategory
);

router.put(
  "/:id",
  validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
  categoriesController.updateCategory
);

router.delete(
  "/:id",
  validate({ params: categoryIdParamSchema }),
  categoriesController.deleteCategory
);

export { router as categoriesRoutes };
