import { Request, Response, NextFunction } from "express";

export function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  if (req.user.role === "admin") {
    const queryRestaurantId = req.query.restaurantId;
    if (queryRestaurantId) {
      const restaurantId = Number(queryRestaurantId);
      if (!Number.isSafeInteger(restaurantId) || restaurantId <= 0) {
        res.status(400).json({ error: "restaurantId inválido" });
        return;
      }
      req.restaurantId = restaurantId;
    } else {
      req.restaurantId = undefined;
    }
  } else {
    if (!req.user.restaurantId) {
      res.status(403).json({ error: "Usuario no asociado a ningún restaurante" });
      return;
    }
    req.restaurantId = req.user.restaurantId;
  }

  next();
}

export function requireTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.restaurantId) {
    res.status(400).json({ error: "restaurantId es obligatorio" });
    return;
  }
  next();
}
