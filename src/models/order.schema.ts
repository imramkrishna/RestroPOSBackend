import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    tableId: z.string().uuid().optional(),
    items: z.array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
        variant: z.string().optional(),
        notes: z.string().optional(),
      })
    ).min(1),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'COOKING', 'SERVED', 'COMPLETED', 'CANCELLED']),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const addOrderItemsSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
        variant: z.string().optional(),
        notes: z.string().optional(),
      })
    ).min(1),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const processPaymentSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'OTHER']),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
