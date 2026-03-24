import { z } from 'zod';

export const createStaffSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'CHEF', 'WAITER']),
    fullName: z.string().min(1),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    shiftStart: z.string().optional(),
    shiftEnd: z.string().optional(),
  }),
});

export const updateStaffSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'CHEF', 'WAITER']).optional(),
    fullName: z.string().min(1).optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    status: z.enum(['ACTIVE', 'LEAVE']).optional(),
    shiftStart: z.string().optional(),
    shiftEnd: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
