import { z } from 'zod';

const orderStatusValues = ['PENDING', 'COOKING', 'SERVED', 'COMPLETED', 'CANCELLED'] as const;
const paymentMethodValues = ['CASH', 'CARD', 'UPI', 'OTHER'] as const;
const orderChannelValues = ['DINE_IN', 'TAKEAWAY', 'ONLINE'] as const;
const deliveryProviderValues = ['PATHAO_FOOD', 'FOOD_MANDU', 'OTHER'] as const;
const settlementStatusValues = ['PENDING', 'SETTLED', 'DISPUTED'] as const;
const dateOnlyString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const onlineOrderDetailsSchema = z.object({
  provider: z.enum(deliveryProviderValues),
  externalOrderId: z.string().trim().min(1).optional(),
  customerName: z.string().trim().min(2),
  customerPhone: z.string().trim().min(5),
  deliveryAddress: z.string().trim().min(5),
  deliveryInstructions: z.string().trim().max(500).optional(),
  providerGrossAmount: z.number().nonnegative().optional(),
  providerCommission: z.number().nonnegative().optional(),
  providerDeliveryFee: z.number().nonnegative().optional(),
  providerDiscount: z.number().nonnegative().optional(),
});

export const createOrderSchema = z.object({
  body: z.object({
    channel: z.enum(orderChannelValues).optional(),
    tableId: z.string().uuid().optional(),
    onlineDetails: onlineOrderDetailsSchema.optional(),
    items: z.array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
        variant: z.string().optional(),
        notes: z.string().optional(),
      })
    ).min(1),
  }).superRefine((data, ctx) => {
    const channel = data.channel ?? (data.tableId ? 'DINE_IN' : 'TAKEAWAY');

    if (channel === 'DINE_IN' && !data.tableId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tableId'],
        message: 'tableId is required for DINE_IN orders',
      });
    }

    if (channel !== 'DINE_IN' && data.tableId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tableId'],
        message: 'tableId is only allowed for DINE_IN orders',
      });
    }

    if (channel === 'ONLINE' && !data.onlineDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['onlineDetails'],
        message: 'onlineDetails are required for ONLINE orders',
      });
    }

    if (channel !== 'ONLINE' && data.onlineDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['onlineDetails'],
        message: 'onlineDetails are only allowed for ONLINE orders',
      });
    }
  }),
});

export const getOrdersQuerySchema = z.object({
  query: z.object({
    status: z.enum(orderStatusValues).optional(),
    channel: z.enum(orderChannelValues).optional(),
    provider: z.enum(deliveryProviderValues).optional(),
    settlementStatus: z.enum(settlementStatusValues).optional(),
    weekStart: dateOnlyString.optional(),
    weekEnd: dateOnlyString.optional(),
  }).superRefine((data, ctx) => {
    if ((data.weekStart && !data.weekEnd) || (!data.weekStart && data.weekEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weekStart'],
        message: 'weekStart and weekEnd must be provided together',
      });
    }
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(orderStatusValues),
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
    paymentMethod: z.enum(paymentMethodValues),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const onlineSettlementSummarySchema = z.object({
  query: z.object({
    provider: z.enum(deliveryProviderValues).optional(),
    weekStart: dateOnlyString,
    weekEnd: dateOnlyString,
  }),
});

export const createSettlementBatchSchema = z.object({
  body: z.object({
    provider: z.enum(deliveryProviderValues),
    weekStart: dateOnlyString,
    weekEnd: dateOnlyString,
    notes: z.string().trim().max(500).optional(),
  }),
});
