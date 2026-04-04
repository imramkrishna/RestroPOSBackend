import prisma from '../config/database.js';
import { createError } from '../utils/AppError.js';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { emitOrderUpdate } from '../utils/socket.js';

const TAX_RATE = 0.05; // 5% tax

export const orderService = {
  async getAllOrders(filters?: { status?: OrderStatus }) {
    const where = filters?.status ? { status: filters.status } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  },

  async createOrder(
    staffId: string,
    data: {
      tableId?: string;
      items: Array<{
        menuItemId: string;
        quantity: number;
        variant?: string;
        notes?: string;
      }>;
    }
  ) {
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

    let subtotal = 0;
    const orderItemsData = data.items.map((item) => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem) {
        throw createError.notFound('Menu item not found');
      }
      if (!menuItem.isAvailable) {
        throw createError.badRequest(`${menuItem.name} is not available`);
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        variant: item.variant,
        priceAtTime: menuItem.price,
        notes: item.notes,
      };
    });

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        staffId,
        tableId: data.tableId,
        subtotal,
        tax,
        total,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
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
      },
    });

    if (data.tableId) {
      await prisma.table.update({
        where: { id: data.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    emitOrderUpdate('order:created', order);

    return order;
  },

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!order) {
      throw createError.notFound('Order not found');
    }

    return order;
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
      include: {
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
      },
    });

    // Emit socket event for order status update
    emitOrderUpdate('order:statusUpdate', updatedOrder);

    return updatedOrder;
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

    let additionalSubtotal = 0;
    const orderItemsData = items.map((item) => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw createError.badRequest('One or more items are not available');
      }

      const itemTotal = menuItem.price * item.quantity;
      additionalSubtotal += itemTotal;

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

    const newSubtotal = order.subtotal + additionalSubtotal;
    const newTax = newSubtotal * TAX_RATE;
    const newTotal = newSubtotal + newTax;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
      },
      include: {
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
      },
    });

    // Emit socket event for order update
    emitOrderUpdate('order:itemsAdded', updatedOrder);

    return updatedOrder;
  },

  async processPayment(orderId: string, paymentMethod: PaymentMethod) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
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
      include: {
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
      },
    });

    if (order.tableId) {
      const activeOrders = await prisma.order.count({
        where: {
          tableId: order.tableId,
          status: {
            in: ['PENDING', 'COOKING', 'SERVED'],
          },
        },
      });

      if (activeOrders === 0) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    // Emit socket event for payment completion
    emitOrderUpdate('order:completed', updatedOrder);

    return updatedOrder;
  },
};
