import prisma from '../config/database.js';
import { createError } from '../utils/AppError.js';
import {
  DeliveryProvider,
  OrderChannel,
  OrderStatus,
  PaymentMethod,
  SettlementStatus,
} from '@prisma/client';
import { emitOrderUpdate } from '../utils/socket.js';

const TAX_RATE = 0.05; // 5% tax included in menu price
const TAX_RATE_PERCENTAGE = TAX_RATE * 100;
const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['PENDING', 'COOKING', 'SERVED'];

const orderInclude = {
  table: true,
  staff: {
    select: {
      id: true,
      username: true,
      role: true,
    },
  },
  orderItems: {
    include: {
      menuItem: true,
    },
  },
  onlineDetails: {
    include: {
      settlementBatch: true,
    },
  },
} as const;

type OrderListFilters = {
  status?: OrderStatus;
  channel?: OrderChannel;
  provider?: DeliveryProvider;
  settlementStatus?: SettlementStatus;
  weekStart?: string;
  weekEnd?: string;
};

type OnlineOrderInput = {
  provider: DeliveryProvider;
  externalOrderId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  providerGrossAmount?: number;
  providerCommission?: number;
  providerDeliveryFee?: number;
  providerDiscount?: number;
};

const parseDateBoundary = (value: string, boundary: 'start' | 'end'): Date => {
  const suffix = boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z';
  const parsed = new Date(`${value}${suffix}`);

  if (Number.isNaN(parsed.getTime())) {
    throw createError.badRequest(`Invalid date value: ${value}`);
  }

  return parsed;
};

const getDateRange = (start?: string, end?: string) => {
  if (!start && !end) {
    return undefined;
  }

  if (!start || !end) {
    throw createError.badRequest('Both weekStart and weekEnd are required together');
  }

  const startDate = parseDateBoundary(start, 'start');
  const endDate = parseDateBoundary(end, 'end');

  if (startDate > endDate) {
    throw createError.badRequest('weekStart cannot be after weekEnd');
  }

  return {
    startDate,
    endDate,
  };
};

const calculateExpectedPayout = (details: OnlineOrderInput): number | undefined => {
  if (details.providerGrossAmount === undefined) {
    return undefined;
  }

  const commission = details.providerCommission ?? 0;
  const discount = details.providerDiscount ?? 0;
  return Math.max(0, details.providerGrossAmount - commission - discount);
};

type BillingOrderItem = {
  priceAtTime: number;
  quantity: number;
};

const roundCurrency = (value: number): number => Number(value.toFixed(2));

const calculateTaxInclusiveBreakdown = (taxInclusiveAmount: number) => {
  const total = roundCurrency(taxInclusiveAmount);
  const subtotal = roundCurrency(total / (1 + TAX_RATE));
  const tax = roundCurrency(total - subtotal);

  return {
    subtotal,
    tax,
    total,
  };
};

const calculateGrossFromItems = (items: BillingOrderItem[]): number => {
  const grossAmount = items.reduce((total, item) => total + item.priceAtTime * item.quantity, 0);
  return roundCurrency(grossAmount);
};

const enrichOrderBillingResponse = <T extends {
  subtotal: number;
  tax: number;
  total: number;
  orderItems: BillingOrderItem[];
}>(order: T) => {
  const grossAmount = calculateGrossFromItems(order.orderItems);
  const { subtotal, tax, total } = calculateTaxInclusiveBreakdown(grossAmount);

  return {
    ...order,
    subtotal,
    tax,
    total,
    taxRatePercentage: TAX_RATE_PERCENTAGE,
  };
};

const releaseTableIfNoActiveOrders = async (tableId?: string | null) => {
  if (!tableId) {
    return;
  }

  const activeOrders = await prisma.order.count({
    where: {
      tableId,
      status: {
        in: ACTIVE_ORDER_STATUSES,
      },
    },
  });

  if (activeOrders === 0) {
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'AVAILABLE' },
    });
  }
};

export const orderService = {
  async getAllOrders(filters?: OrderListFilters) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.channel) {
      where.channel = filters.channel;
    }

    const dateRange = getDateRange(filters?.weekStart, filters?.weekEnd);
    if (dateRange) {
      where.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    if (filters?.provider || filters?.settlementStatus) {
      where.onlineDetails = {
        is: {
          ...(filters.provider ? { provider: filters.provider } : {}),
          ...(filters.settlementStatus ? { settlementStatus: filters.settlementStatus } : {}),
        },
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => enrichOrderBillingResponse(order));
  },

  async createOrder(
    staffId: string,
    data: {
      channel?: OrderChannel;
      tableId?: string;
      onlineDetails?: OnlineOrderInput;
      items: Array<{
        menuItemId: string;
        quantity: number;
        variant?: string;
        notes?: string;
      }>;
    }
  ) {
    const channel: OrderChannel = data.channel ?? (data.tableId ? 'DINE_IN' : 'TAKEAWAY');

    if (channel === 'DINE_IN' && !data.tableId) {
      throw createError.badRequest('tableId is required for DINE_IN orders');
    }

    if (channel !== 'DINE_IN' && data.tableId) {
      throw createError.badRequest('tableId is only allowed for DINE_IN orders');
    }

    if (channel === 'ONLINE' && !data.onlineDetails) {
      throw createError.badRequest('onlineDetails are required for ONLINE orders');
    }

    if (channel !== 'ONLINE' && data.onlineDetails) {
      throw createError.badRequest('onlineDetails are only allowed for ONLINE orders');
    }

    if (data.tableId) {
      const table = await prisma.table.findUnique({
        where: { id: data.tableId },
      });

      if (!table) {
        throw createError.notFound('Table not found');
      }

      if (table.status === 'RESERVED') {
        throw createError.badRequest('Table is reserved');
      }
    }

    const menuItemIds = data.items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw createError.notFound('One or more menu items not found');
    }

    const menuItemsMap = new Map(menuItems.map((item) => [item.id, item]));

    let grossTotal = 0;
    const orderItemsData = data.items.map((item) => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem) {
        throw createError.notFound('Menu item not found');
      }
      if (!menuItem.isAvailable) {
        throw createError.badRequest(`${menuItem.name} is not available`);
      }

      const itemTotal = menuItem.price * item.quantity;
      grossTotal += itemTotal;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        variant: item.variant,
        priceAtTime: menuItem.price,
        notes: item.notes,
      };
    });

    const { subtotal, tax, total } = calculateTaxInclusiveBreakdown(grossTotal);

    const orderCreateData: any = {
      staffId,
      channel,
      tableId: data.tableId,
      subtotal,
      tax,
      total,
      orderItems: {
        create: orderItemsData,
      },
    };

    if (channel === 'ONLINE' && data.onlineDetails) {
      orderCreateData.onlineDetails = {
        create: {
          ...data.onlineDetails,
          expectedPayout: calculateExpectedPayout(data.onlineDetails),
        },
      };
    }

    const order = await prisma.order.create({
      data: orderCreateData,
      include: orderInclude,
    });

    const enrichedOrder = enrichOrderBillingResponse(order);

    if (channel === 'DINE_IN' && data.tableId) {
      await prisma.table.update({
        where: { id: data.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    emitOrderUpdate('order:created', enrichedOrder);

    return enrichedOrder;
  },

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw createError.notFound('Order not found');
    }

    return enrichOrderBillingResponse(order);
  },

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw createError.notFound('Order not found');
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw createError.badRequest('Cannot update completed or cancelled order');
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });

    const enrichedOrder = enrichOrderBillingResponse(updatedOrder);

    // Emit socket event for order status update
    emitOrderUpdate('order:statusUpdate', enrichedOrder);

    return enrichedOrder;
  },

  async cancelOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw createError.notFound('Order not found');
    }

    if (order.status === 'COMPLETED') {
      throw createError.badRequest('Cannot cancel completed order');
    }

    if (order.status === 'CANCELLED') {
      throw createError.badRequest('Order already cancelled');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: orderInclude,
    });

    const enrichedOrder = enrichOrderBillingResponse(updatedOrder);

    await releaseTableIfNoActiveOrders(order.tableId);

    emitOrderUpdate('order:cancelled', enrichedOrder);

    return enrichedOrder;
  },

  async cancelOrderItem(orderId: string, orderItemId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw createError.notFound('Order not found');
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw createError.badRequest('Cannot cancel item from completed or cancelled order');
    }

    const existingOrderItem = await prisma.orderItem.findFirst({
      where: {
        id: orderItemId,
        orderId,
      },
    });

    if (!existingOrderItem) {
      throw createError.notFound('Order item not found for this order');
    }

    await prisma.orderItem.delete({
      where: { id: orderItemId },
    });

    const remainingOrderItems = await prisma.orderItem.findMany({
      where: { orderId },
      select: {
        priceAtTime: true,
        quantity: true,
      },
    });

    if (remainingOrderItems.length === 0) {
      const cancelledOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          subtotal: 0,
          tax: 0,
          total: 0,
        },
        include: orderInclude,
      });

      const enrichedCancelledOrder = enrichOrderBillingResponse(cancelledOrder);
      await releaseTableIfNoActiveOrders(order.tableId);
      emitOrderUpdate('order:cancelled', enrichedCancelledOrder);

      return enrichedCancelledOrder;
    }

    const grossTotal = calculateGrossFromItems(remainingOrderItems);
    const { subtotal: newSubtotal, tax: newTax, total: newTotal } =
      calculateTaxInclusiveBreakdown(grossTotal);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
      },
      include: orderInclude,
    });

    const enrichedOrder = enrichOrderBillingResponse(updatedOrder);
    emitOrderUpdate('order:itemCancelled', enrichedOrder);

    return enrichedOrder;
  },

  async addOrderItems(
    orderId: string,
    items: Array<{
      menuItemId: string;
      quantity: number;
      variant?: string;
      notes?: string;
    }>
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw createError.notFound('Order not found');
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw createError.badRequest('Cannot add items to completed or cancelled order');
    }

    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw createError.notFound('One or more menu items not found');
    }

    const menuItemsMap = new Map(menuItems.map((item) => [item.id, item]));

    const orderItemsData = items.map((item) => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw createError.badRequest('One or more items are not available');
      }

      return {
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        variant: item.variant,
        priceAtTime: menuItem.price,
        notes: item.notes,
      };
    });

    await prisma.orderItem.createMany({
      data: orderItemsData,
    });

    const allOrderItems = await prisma.orderItem.findMany({
      where: { orderId },
      select: {
        priceAtTime: true,
        quantity: true,
      },
    });

    const grossTotal = calculateGrossFromItems(allOrderItems);
    const { subtotal: newSubtotal, tax: newTax, total: newTotal } =
      calculateTaxInclusiveBreakdown(grossTotal);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
      },
      include: orderInclude,
    });

    const enrichedOrder = enrichOrderBillingResponse(updatedOrder);

    // Emit socket event for order update
    emitOrderUpdate('order:itemsAdded', enrichedOrder);

    return enrichedOrder;
  },

  async processPayment(orderId: string, paymentMethod: PaymentMethod) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true, onlineDetails: true },
    });

    if (!order) {
      throw createError.notFound('Order not found');
    }

    if (order.status === 'COMPLETED') {
      throw createError.badRequest('Order already completed');
    }

    if (order.status === 'CANCELLED') {
      throw createError.badRequest('Cannot process payment for cancelled order');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        paymentMethod,
      },
      include: orderInclude,
    });

    const enrichedOrder = enrichOrderBillingResponse(updatedOrder);

    await releaseTableIfNoActiveOrders(order.tableId);

    // Emit socket event for payment completion
    emitOrderUpdate('order:completed', enrichedOrder);

    return enrichedOrder;
  },

  async getOnlineSettlementSummary(filters: {
    provider?: DeliveryProvider;
    weekStart: string;
    weekEnd: string;
  }) {
    const dateRange = getDateRange(filters.weekStart, filters.weekEnd)!;

    const where: any = {
      settlementStatus: 'PENDING' as SettlementStatus,
      ...(filters.provider ? { provider: filters.provider } : {}),
      order: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    };

    const grouped = await prisma.onlineOrderDetails.groupBy({
      by: ['provider'],
      where,
      _count: { _all: true },
      _sum: {
        providerGrossAmount: true,
        providerCommission: true,
        providerDiscount: true,
        expectedPayout: true,
      },
    });

    const providers = grouped.map((group) => {
      const grossAmount = group._sum.providerGrossAmount ?? 0;
      const commissionAmount = group._sum.providerCommission ?? 0;
      const discountAmount = group._sum.providerDiscount ?? 0;
      const netAmount = group._sum.expectedPayout ?? grossAmount - commissionAmount - discountAmount;

      return {
        provider: group.provider,
        orderCount: group._count._all,
        grossAmount,
        commissionAmount,
        discountAmount,
        netAmount,
      };
    });

    const totals = providers.reduce(
      (acc, provider) => ({
        orderCount: acc.orderCount + provider.orderCount,
        grossAmount: acc.grossAmount + provider.grossAmount,
        commissionAmount: acc.commissionAmount + provider.commissionAmount,
        discountAmount: acc.discountAmount + provider.discountAmount,
        netAmount: acc.netAmount + provider.netAmount,
      }),
      {
        orderCount: 0,
        grossAmount: 0,
        commissionAmount: 0,
        discountAmount: 0,
        netAmount: 0,
      }
    );

    return {
      weekStart: filters.weekStart,
      weekEnd: filters.weekEnd,
      providers,
      totals,
    };
  },

  async createSettlementBatch(data: {
    provider: DeliveryProvider;
    weekStart: string;
    weekEnd: string;
    notes?: string;
  }) {
    const dateRange = getDateRange(data.weekStart, data.weekEnd)!;

    const existingBatch = await prisma.settlementBatch.findFirst({
      where: {
        provider: data.provider,
        weekStart: dateRange.startDate,
        weekEnd: dateRange.endDate,
      },
    });

    if (existingBatch) {
      throw createError.badRequest('Settlement batch already exists for this provider and week range');
    }

    const where: any = {
      provider: data.provider,
      settlementStatus: 'PENDING' as SettlementStatus,
      order: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    };

    const pendingOnlineOrders = await prisma.onlineOrderDetails.findMany({
      where,
      select: {
        id: true,
        providerGrossAmount: true,
        providerCommission: true,
        providerDiscount: true,
        expectedPayout: true,
      },
    });

    if (pendingOnlineOrders.length === 0) {
      throw createError.badRequest('No pending online orders found for this provider and week range');
    }

    const grossAmount = pendingOnlineOrders.reduce(
      (total, order) => total + (order.providerGrossAmount ?? 0),
      0
    );
    const commissionAmount = pendingOnlineOrders.reduce(
      (total, order) => total + (order.providerCommission ?? 0),
      0
    );
    const discountAmount = pendingOnlineOrders.reduce(
      (total, order) => total + (order.providerDiscount ?? 0),
      0
    );
    const netAmount = pendingOnlineOrders.reduce(
      (total, order) =>
        total +
        (order.expectedPayout ??
          (order.providerGrossAmount ?? 0) -
            (order.providerCommission ?? 0) -
            (order.providerDiscount ?? 0)),
      0
    );

    const settledAt = new Date();

    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.settlementBatch.create({
        data: {
          provider: data.provider,
          weekStart: dateRange.startDate,
          weekEnd: dateRange.endDate,
          orderCount: pendingOnlineOrders.length,
          grossAmount,
          commissionAmount,
          netAmount,
          notes: data.notes,
          settledAt,
        },
      });

      await tx.onlineOrderDetails.updateMany({
        where,
        data: {
          settlementStatus: 'SETTLED',
          settlementBatchId: createdBatch.id,
          settledAt,
        },
      });

      return tx.settlementBatch.findUnique({
        where: { id: createdBatch.id },
        include: {
          onlineOrders: {
            include: {
              order: {
                include: orderInclude,
              },
            },
          },
        },
      });
    });

    if (!batch) {
      throw createError.internal('Failed to create settlement batch');
    }

    const onlineOrdersWithTaxRate = batch.onlineOrders.map((onlineOrder) => ({
      ...onlineOrder,
      order: enrichOrderBillingResponse(onlineOrder.order),
    }));

    return {
      ...batch,
      onlineOrders: onlineOrdersWithTaxRate,
      discountAmount,
    };
  },
};
