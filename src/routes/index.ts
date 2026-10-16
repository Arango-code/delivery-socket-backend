import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { ordersRoutes } from "./orders.routes";
import { productsRoutes } from "./products.routes";
import { categoriesRoutes } from "./categories.routes";
import { restaurantsRoutes } from "./restaurants.routes";
import { usersRoutes } from "./users.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/orders", ordersRoutes);
router.use("/products", productsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/restaurants", restaurantsRoutes);
router.use("/users", usersRoutes);

export { router as routes };
