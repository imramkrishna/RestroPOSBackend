import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const requiredString = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1)
);

const optionalString = z.preprocess(
  emptyStringToUndefined,
  z.string().optional()
);

const createReservationBodySchema = z
  .object({
    tableId: z.preprocess(emptyStringToUndefined, z.string().uuid()),
    customerName: requiredString,
    phone: z.preprocess(emptyStringToUndefined, z.string().min(10)).optional(),
    customerPhone: z.preprocess(emptyStringToUndefined, z.string().min(10)).optional(),
    guestCount: z.number().int().positive().optional(),
    partySize: z.number().int().positive().optional(),
    datetime: z.preprocess(emptyStringToUndefined, z.string().datetime()).optional(),
    date: optionalString,
    startTime: optionalString,
    endTime: optionalString,
    notes: optionalString,
  })
  .superRefine((data, ctx) => {
    if (!data.phone && !data.customerPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Phone is required',
      });
    }

    if (data.guestCount === undefined && data.partySize === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['guestCount'],
        message: 'Guest count is required',
      });
    }

    const hasDatetime = Boolean(data.datetime);
    const hasDateAndStart = Boolean(data.date && data.startTime);

    if (!hasDatetime && !hasDateAndStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['datetime'],
        message: 'Datetime is required',
      });
    }

    if (!hasDatetime && hasDateAndStart) {
      const parsed = new Date(`${data.date}T${data.startTime}`);
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['datetime'],
          message: 'Invalid date or start time',
        });
      }
    }
  })
  .transform((data) => {
    const normalizedDatetime = data.datetime
      ? data.datetime
      : new Date(`${data.date}T${data.startTime}`).toISOString();

    return {
      tableId: data.tableId,
      customerName: data.customerName,
      phone: data.phone ?? data.customerPhone!,
      guestCount: data.guestCount ?? data.partySize!,
      datetime: normalizedDatetime,
      notes: data.notes,
    };
  });

export const createReservationSchema = z.object({
  body: createReservationBodySchema,
});

export const updateReservationSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
