import { z } from 'zod';

export const createReservationSchema = z.object({
  body: z.object({
    tableId: z.string().uuid(),
    customerName: z.string().min(1),
    phone: z.string().min(10),
    guestCount: z.number().int().positive(),
    datetime: z.string().datetime(),
    notes: z.string().optional(),
  }),
});

export const updateReservationSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
