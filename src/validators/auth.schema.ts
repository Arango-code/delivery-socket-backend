import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username es obligatorio"),
  password: z.string().min(1, "Password es obligatorio"),
});

export const registerSchema = z.object({
  username: z.string().min(1, "Username es obligatorio").max(50),
  password: z.string().min(6, "Password debe tener al menos 6 caracteres"),
  restaurant_id: z.number().int().positive().optional().nullable(),
  is_super_admin: z.boolean().optional().default(false),
  rol: z.string().optional().nullable(),
});
