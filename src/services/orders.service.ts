import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/error.middleware";
import { Prisma } from "../lib/generated/prisma/client";
import { createConfirmationToken, verifyConfirmationToken } from "../lib/jwt";
import { priceOrderItems } from "../lib/order-pricing";
import { ORDER_INCLUDE } from "../types/models";
import {
  emitNewOrder,
  emitOrderUpdated,
  emitWaitingConfirmation,
  emitOrderConfirmed,
  emitOrderCancelled,
} from "../socket/emitters/order.emitter";

const VALID_TRANSITIONS: Record<string, string[]> = {
  REVIEW: ["CANCELLED"],
  WAITING_CLIENT_CONFIRMATION: ["CANCELLED"],
  CONFIRMED: ["DELIVERY", "CANCELLED"],
  DELIVERY: ["FINISHED", "CANCELLED"],
  FINISHED: [],
  CANCELLED: [],
};

export class OrdersService {
  async getOrders(restaurantId?: number) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const where: any = {
      is_complete: true,
      AND: [
        {
          OR: [
            {
              status: { in: ["FINISHED", "CANCELLED"] },
              order_date: { gte: startOfToday },
            },
            {
              NOT: { status: { in: ["FINISHED", "CANCELLED"] } },
            },
          ],
        },
      ],
    };

    if (restaurantId) {
      where.restaurant_id = restaurantId;
    }

    return prisma.orders.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { order_date: "desc" },
    });
  }

  async getOrderById(orderId: number, restaurantId?: number) {
    const where: any = { order_id: orderId };
    if (restaurantId) {
      where.restaurant_id = restaurantId;
    }

    const order = await prisma.orders.findFirst({
      where,
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new AppError("Orden no encontrada", 404);
    }

    return order;
  }

  async createOrder(data: {
    external_id: string;
    restaurant_id: number;
    client_id: number;
    order_number?: string | null;
    delivery_hour?: string | null;
    delivery_address?: string | null;
    special_instructions?: string | null;
    is_takeaway?: boolean;
    payment_method?: string | null;
    order_items: Array<{
      product_id: number;
      quantity: number;
      special_instructions?: string | null;
    }>;
  }) {
    const existingOrder = await prisma.orders.findUnique({
      where: { external_id: data.external_id },
      include: ORDER_INCLUDE,
    });
    if (existingOrder) {
      if (existingOrder.restaurant_id !== data.restaurant_id || existingOrder.client_id !== data.client_id) {
        throw new AppError("El identificador externo ya pertenece a otro pedido", 409);
      }
      const confirmation_token = await createConfirmationToken(
        existingOrder.order_id,
        existingOrder.client_id
      );
      return { ...existingOrder, confirmation_token };
    }

    const productIds = [...new Set(data.order_items.map((item) => item.product_id))];
    const [restaurant, client, products] = await Promise.all([
      prisma.restaurants.findUnique({ where: { restaurant_id: data.restaurant_id } }),
      prisma.clients.findUnique({ where: { client_id: data.client_id } }),
      prisma.products.findMany({
        where: { product_id: { in: productIds }, restaurant_id: data.restaurant_id },
      }),
    ]);

    if (!restaurant || !client) {
      throw new AppError("Restaurante o cliente no encontrado", 400);
    }
    if (products.length !== productIds.length) {
      throw new AppError("Hay productos que no pertenecen al restaurante", 400);
    }

    const { items, subtotal } = priceOrderItems(data.order_items, products);

    const order = await prisma.orders.create({
      data: {
        external_id: data.external_id,
        restaurant_id: data.restaurant_id,
        client_id: data.client_id,
        order_number: data.order_number ?? null,
        delivery_hour: data.delivery_hour ? new Date(data.delivery_hour) : null,
        total_amount: subtotal,
        subtotal,
        delivery_fee: new Prisma.Decimal(0),
        discount_amount: new Prisma.Decimal(0),
        delivery_address: data.delivery_address ?? null,
        special_instructions: data.special_instructions ?? null,
        is_takeaway: data.is_takeaway ?? false,
        is_active: true,
        is_complete: true,
        status: "REVIEW",
        payment_method: data.payment_method ?? null,
        order_items: { create: items },
      },
      include: ORDER_INCLUDE,
    });

    emitNewOrder(order);
    const confirmation_token = await createConfirmationToken(order.order_id, order.client_id);
    return { ...order, confirmation_token };
  }

  async updateStatus(
    orderId: number,
    newStatus: string,
    restaurantId?: number
  ) {
    const currentOrder = await prisma.orders.findUnique({
      where: { order_id: orderId },
    });

    if (!currentOrder) {
      throw new AppError("Orden no encontrada", 404);
    }

    if (restaurantId && currentOrder.restaurant_id !== restaurantId) {
      throw new AppError("No tienes acceso a esta orden", 403);
    }

    if (!currentOrder.is_complete) {
      throw new AppError(
        "No se puede cambiar el estado. La orden no está marcada como completa.",
        400
      );
    }

    const allowedTransitions = VALID_TRANSITIONS[currentOrder.status];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Transición inválida: ${currentOrder.status} → ${newStatus}`,
        400
      );
    }

    const result = await prisma.orders.updateMany({
      where: { order_id: orderId, status: currentOrder.status, is_complete: true },
      data: { status: newStatus },
    });
    if (result.count === 0) {
      throw new AppError("La orden cambió de estado; vuelve a intentarlo", 409);
    }
    const updatedOrder = await prisma.orders.findUniqueOrThrow({
      where: { order_id: orderId },
      include: ORDER_INCLUDE,
    });

    emitOrderUpdated(updatedOrder);
    return updatedOrder;
  }

  async updateDeliveryFee(
    orderId: number,
    deliveryFee: number,
    restaurantId?: number
  ) {
    const currentOrder = await prisma.orders.findUnique({
      where: { order_id: orderId },
    });

    if (!currentOrder) {
      throw new AppError("Orden no encontrada", 404);
    }

    if (restaurantId && currentOrder.restaurant_id !== restaurantId) {
      throw new AppError("No tienes acceso a esta orden", 403);
    }

    if (currentOrder.status !== "REVIEW") {
      throw new AppError(
        "Solo se puede asignar delivery fee a órdenes en estado REVIEW",
        400
      );
    }

    const subtotal = new Prisma.Decimal(currentOrder.subtotal ?? 0);
    const discount = new Prisma.Decimal(currentOrder.discount_amount ?? 0);
    const totalAmount = subtotal.plus(new Prisma.Decimal(deliveryFee)).minus(discount);
    if (totalAmount.isNegative()) {
      throw new AppError("El total de la orden no puede ser negativo", 400);
    }

    const result = await prisma.orders.updateMany({
      where: { order_id: orderId, status: "REVIEW", is_complete: true },
      data: {
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        status: "WAITING_CLIENT_CONFIRMATION",
      },
    });
    if (result.count === 0) {
      throw new AppError("La orden cambió de estado; vuelve a intentarlo", 409);
    }
    const updatedOrder = await prisma.orders.findUniqueOrThrow({
      where: { order_id: orderId },
      include: ORDER_INCLUDE,
    });

    emitWaitingConfirmation(updatedOrder);
    return updatedOrder;
  }

  async confirmOrder(
    orderId: number,
    action: "confirm" | "cancel",
    confirmationToken: string
  ) {
    const order = await prisma.orders.findUnique({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new AppError("Orden no encontrada", 404);
    }

    if (!(await verifyConfirmationToken(confirmationToken, orderId, order.client_id))) {
      throw new AppError("No tienes acceso a esta orden", 403);
    }

    if (order.status !== "WAITING_CLIENT_CONFIRMATION") {
      throw new AppError(
        "La orden no está esperando confirmación del cliente",
        400
      );
    }

    const newStatus = action === "confirm" ? "CONFIRMED" : "CANCELLED";

    const result = await prisma.orders.updateMany({
      where: { order_id: orderId, status: "WAITING_CLIENT_CONFIRMATION" },
      data: { status: newStatus },
    });
    if (result.count === 0) {
      throw new AppError("La orden cambió de estado; vuelve a intentarlo", 409);
    }
    const updatedOrder = await prisma.orders.findUniqueOrThrow({
      where: { order_id: orderId },
      include: ORDER_INCLUDE,
    });

    if (action === "confirm") {
      emitOrderConfirmed(updatedOrder);
    } else {
      emitOrderCancelled(updatedOrder);
    }

    return updatedOrder;
  }
}

export const ordersService = new OrdersService();
