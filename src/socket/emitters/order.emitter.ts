import { getIO } from "../index";
import { OrderWithRelations } from "../../types/models";

export function emitNewOrder(order: OrderWithRelations): void {
  const io = getIO();
  io.to(`restaurant:${order.restaurant_id}`).emit("order:new", order);
  io.to("admin:all").emit("order:new", order);
}

export function emitOrderUpdated(order: OrderWithRelations): void {
  const io = getIO();
  io.to(`restaurant:${order.restaurant_id}`).emit("order:updated", order);
  io.to(`order:${order.order_id}`).emit("order:updated", order);
  io.to("admin:all").emit("order:updated", order);
}

export function emitWaitingConfirmation(order: OrderWithRelations): void {
  const io = getIO();
  io.to(`order:${order.order_id}`).emit("order:waiting-confirmation", order);
  io.to(`restaurant:${order.restaurant_id}`).emit("order:updated", order);
  io.to("admin:all").emit("order:updated", order);
}

export function emitOrderConfirmed(order: OrderWithRelations): void {
  const io = getIO();
  io.to(`restaurant:${order.restaurant_id}`).emit("order:confirmed", order);
  io.to(`order:${order.order_id}`).emit("order:confirmed", order);
  io.to("admin:all").emit("order:confirmed", order);
}

export function emitOrderCancelled(order: OrderWithRelations): void {
  const io = getIO();
  io.to(`restaurant:${order.restaurant_id}`).emit("order:cancelled", order);
  io.to(`order:${order.order_id}`).emit("order:cancelled", order);
  io.to("admin:all").emit("order:cancelled", order);
}
