import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(20),
  description: z.string().max(255).optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(20).optional(),
  description: z.string().max(255).optional().nullable(),
});

export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
