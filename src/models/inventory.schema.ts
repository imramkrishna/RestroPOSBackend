import { z } from 'zod';

export const updateInventorySchema = z.object({
  body: z.object({
    quantity: z.number(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createInventorySchema = z.object({
  body: z.object({
    itemName: z.string().min(1),
    category: z.string().min(1),
    quantity: z.number(),
    unit: z.string().min(1),
    minStockLevel: z.number(),
    costPrice: z.number().positive(),
  }),
});
