import { timingSafeEqual } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function webhookMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const provided = req.header("x-webhook-key");
  if (!provided) {
    res.status(401).json({ error: "Clave de integración requerida" });
    return;
  }

  const received = Buffer.from(provided);
  const expected = Buffer.from(env.WEBHOOK_API_KEY);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    res.status(401).json({ error: "Clave de integración inválida" });
    return;
  }

  next();
}
