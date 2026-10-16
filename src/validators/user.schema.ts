import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(6),
  restaurant_id: z.number().int().positive().optional().nullable(),
  is_super_admin: z.boolean().optional().default(false),
  rol: z.string().optional().nullable(),
});

export const updateUserSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  password: z.string().min(6).optional(),
  restaurant_id: z.number().int().positive().optional().nullable(),
  rol: z.string().optional().nullable(),
});

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
