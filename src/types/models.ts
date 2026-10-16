import type { Prisma } from "../lib/generated/prisma/client";

export interface UserPayload {
  id: number;
  username: string;
  role: "admin" | "user";
  restaurantId: number | null;
}

export const ORDER_INCLUDE = {
  restaurants: { select: { restaurant_id: true, name: true } },
  order_items: { include: { products: { select: { name: true } } } },
  clients: true,
} as const satisfies Prisma.ordersInclude;

export type OrderWithRelations = Prisma.ordersGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;
