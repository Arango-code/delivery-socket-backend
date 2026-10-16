import { z } from "zod";

export const createRestaurantSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(100).optional().nullable(),
  opening_time: z.string().optional().nullable(),
  closing_time: z.string().optional().nullable(),
  payment_methods: z.string().optional().nullable(),
  delivery_areas: z.string().optional().nullable(),
  pick_up_location: z.string().max(255).optional().nullable(),
  return_policy: z.string().optional().nullable(),
  cancellation_policy: z.string().optional().nullable(),
  delivery_rules: z.string().optional().nullable(),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(100).optional().nullable(),
  opening_time: z.string().optional().nullable(),
  closing_time: z.string().optional().nullable(),
  payment_methods: z.string().optional().nullable(),
  delivery_areas: z.string().optional().nullable(),
  pick_up_location: z.string().max(255).optional().nullable(),
  return_policy: z.string().optional().nullable(),
  cancellation_policy: z.string().optional().nullable(),
  delivery_rules: z.string().optional().nullable(),
});

export const restaurantIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
