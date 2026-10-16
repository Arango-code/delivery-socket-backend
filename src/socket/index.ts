import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { decrypt } from "../lib/jwt";
import { handleConnection } from "./handlers/connection.handler";
import { prisma } from "../lib/prisma";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types/socket.d";

let io: Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function initializeSocket(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    maxHttpBufferSize: 100_000,
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error("Token de autenticación requerido"));
    }

    const payload = await decrypt(token);
    if (!payload) {
      return next(new Error("Token inválido o expirado"));
    }

    if (!Number.isSafeInteger(payload.id)) {
      return next(new Error("Token inválido"));
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
        return next(new Error("Usuario inactivo o inexistente"));
      }

      socket.data.user = {
        id: user.usuario_id,
        username: user.username,
        role: user.is_super_admin ? "admin" : "user",
        restaurantId: user.restaurant_id,
      };
    } catch {
      return next(new Error("No se pudo verificar el usuario"));
    }

    next();
  });

  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });
}

export function getIO(): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  if (!io) {
    throw new Error("Socket.IO no ha sido inicializado");
  }
  return io;
}
