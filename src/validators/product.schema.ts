import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  category_id: z.number().int().positive(),
  is_available: z.boolean().optional().default(true),
  preparation_time: z.number().int().positive().optional().nullable(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  category_id: z.number().int().positive().optional(),
  is_available: z.boolean().optional(),
  preparation_time: z.number().int().positive().optional().nullable(),
});

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
