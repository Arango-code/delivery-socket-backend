import { Router } from "express";
import { restaurantsController } from "../controllers/restaurants.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { canAccessRestaurant } from "../lib/authorization";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  restaurantIdParamSchema,
} from "../validators/restaurant.schema";

const router = Router();

router.get("/by-name", restaurantsController.getByName);

router.get(
  "/",
  authMiddleware,
  requireRole("admin"),
  restaurantsController.getAll
);

router.get(
  "/:id",
  authMiddleware,
  validate({ params: restaurantIdParamSchema }),
  (req, res, next) => {
    if (!canAccessRestaurant(req.user!, Number(req.params.id))) {
      res.status(403).json({ error: "No tienes acceso a este restaurante" });
      return;
    }
    next();
  },
  restaurantsController.getById
);

router.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  validate({ body: createRestaurantSchema }),
  restaurantsController.create
);

router.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  validate({ params: restaurantIdParamSchema, body: updateRestaurantSchema }),
  restaurantsController.update
);

export { router as restaurantsRoutes };
