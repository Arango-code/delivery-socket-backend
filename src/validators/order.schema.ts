import { z } from "zod";

const estadoEnum = z.enum([
  "REVIEW",
  "CONFIRMED",
  "DELIVERY",
  "FINISHED",
  "CANCELLED",
  "WAITING_CLIENT_CONFIRMATION",
]);

export const createOrderSchema = z.object({
  external_id: z.string().min(1).max(100),
  restaurant_id: z.number().int().positive(),
  client_id: z.number().int().positive(),
  order_number: z.string().optional().nullable(),
  delivery_hour: z.string().datetime().optional().nullable(),
  delivery_address: z.string().optional().nullable(),
  special_instructions: z.string().optional().nullable(),
  is_takeaway: z.boolean().optional().default(false),
  payment_method: z.string().max(10).optional().nullable(),
  order_items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive(),
        special_instructions: z.string().optional().nullable(),
      })
    )
    .min(1),
});

export const updateStatusSchema = z.object({
  newStatus: estadoEnum,
});

export const updateDeliveryFeeSchema = z.object({
  delivery_fee: z.number().nonnegative("Delivery fee debe ser positivo"),
});

export const confirmOrderSchema = z.object({
  action: z.enum(["confirm", "cancel"]),
  confirmation_token: z.string().min(1),
});

export const orderIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
