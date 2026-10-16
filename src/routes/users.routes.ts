import { Router } from "express";
import { usersController } from "../controllers/users.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateUserSchema, userIdParamSchema } from "../validators/user.schema";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireRole("admin"),
  usersController.getAll
);

router.get(
  "/by-restaurant",
  authMiddleware,
  tenantMiddleware,
  usersController.getByRestaurant
);

router.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  usersController.update
);

router.patch(
  "/:id/toggle-active",
  authMiddleware,
  requireRole("admin"),
  validate({ params: userIdParamSchema }),
  usersController.toggleActive
);

export { router as usersRoutes };
