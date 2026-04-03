import { z } from 'zod';

const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional()
);

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    icon: z.string().optional(),
    imageUrl: optionalUrl,
  }),
});

export const createMenuItemSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().positive(),
    imageUrl: optionalUrl,
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
    imageUrl: optionalUrl,
    isAvailable: z.boolean().optional(),
    sizes: z.any().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
