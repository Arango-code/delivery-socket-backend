import { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../../types/socket.d";
import { prisma } from "../../lib/prisma";
import { canAccessRestaurant } from "../../lib/authorization";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function handleConnection(io: TypedIO, socket: TypedSocket): void {
  const user = socket.data.user!;

  if (user.role === "admin") {
    socket.join("admin:all");
    console.log(`[Socket] Super admin ${user.username} connected → admin:all`);
  }

  if (user.restaurantId) {
    socket.join(`restaurant:${user.restaurantId}`);
    console.log(
      `[Socket] User ${user.username} connected → restaurant:${user.restaurantId}`
    );
  }

  socket.on("join:order", async (orderId, acknowledge) => {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      acknowledge?.({ ok: false, error: "ID de pedido inválido" });
      return;
    }

    try {
      const order = await prisma.orders.findUnique({
        where: { order_id: orderId },
        select: { restaurant_id: true },
      });
      if (!order || !canAccessRestaurant(user, order.restaurant_id)) {
        acknowledge?.({ ok: false, error: "Pedido no encontrado" });
        return;
      }

      await socket.join(`order:${orderId}`);
      acknowledge?.({ ok: true });
    } catch {
      acknowledge?.({ ok: false, error: "No se pudo unir al pedido" });
    }
  });

  socket.on("leave:order", (orderId: number) => {
    if (Number.isSafeInteger(orderId) && orderId > 0) {
      socket.leave(`order:${orderId}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] ${user.username} disconnected: ${reason}`);
  });
}
