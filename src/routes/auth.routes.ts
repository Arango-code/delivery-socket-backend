import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.schema";

const router = Router();

router.post(
  "/login",
  validate({ body: loginSchema }),
  authController.login
);

router.post(
  "/register",
  authMiddleware,
  requireRole("admin"),
  validate({ body: registerSchema }),
  authController.register
);

router.get("/me", authMiddleware, authController.me);

export { router as authRoutes };
