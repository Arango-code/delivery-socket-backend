import { Request, Response, NextFunction } from "express";
import { decrypt } from "../lib/jwt";
import { prisma } from "../lib/prisma";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticación requerido" });
    return;
  }

  const token = header.split(" ")[1];
  const payload = await decrypt(token);

  if (!payload || !Number.isSafeInteger(payload.id)) {
    res.status(401).json({ error: "Token inválido o expirado" });
    return;
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { usuario_id: payload.id },
      select: {
        usuario_id: true,
        username: true,
        is_active: true,
        is_super_admin: true,
        restaurant_id: true,
      },
    });
    if (!user?.is_active) {
      res.status(401).json({ error: "Usuario inactivo o inexistente" });
      return;
    }

    req.user = {
      id: user.usuario_id,
      username: user.username,
      role: user.is_super_admin ? "admin" : "user",
      restaurantId: user.restaurant_id,
    };
  } catch (error) {
    next(error);
    return;
  }

  next();
}
