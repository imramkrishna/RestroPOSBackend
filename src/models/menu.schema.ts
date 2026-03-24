import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    icon: z.string().optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const createMenuItemSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().positive(),
    imageUrl: z.string().url().optional(),
    isAvailable: z.boolean().optional(),
    sizes: z.any().optional(),
  }),
});

export const updateMenuItemSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    imageUrl: z.string().url().optional(),
    isAvailable: z.boolean().optional(),
    sizes: z.any().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
