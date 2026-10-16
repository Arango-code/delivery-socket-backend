import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({ error: "Datos de entrada inválidos", details: errors });
    return;
  }

  if ((err as any).code === "P2002") {
    const target = (err as any).meta?.target;
    res.status(409).json({
      error: `Ya existe un registro con ese valor único${target ? `: ${target}` : ""}`,
    });
    return;
  }

  if ((err as any).code === "P2025") {
    res.status(404).json({ error: "Registro no encontrado" });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
