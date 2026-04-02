import prisma from '../config/database';
import { createError } from '../utils/AppError';

export const inventoryService = {
  async getAllInventory() {
    const inventory = await prisma.inventory.findMany({
      orderBy: { itemName: 'asc' },
    });
    return inventory;
  },

  async createInventoryItem(data: {
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    minStockLevel: number;
    costPrice: number;
  }) {
    return await prisma.inventory.create({ data });
  },

  async getInventoryById(id: string) {
    const item = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!item) {
      throw createError.notFound('Inventory item not found');
    }

    return item;
  },

  async updateInventoryQuantity(id: string, quantity: number) {
    const item = await prisma.inventory.findUnique({
      where: { id },
    });
    
    if (!item) {
      throw createError.notFound('Inventory item not found');
    }

    return await prisma.inventory.update({
      where: { id },
      data: { quantity },
    });
  },

  async getLowStockAlerts() {
    const lowStockItems = await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: prisma.inventory.fields.minStockLevel,
        },
      },
      orderBy: { quantity: 'asc' },
    });

    return lowStockItems;
  },

  async deleteInventoryItem(id: string) {
    const item = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!item) {
      throw createError.notFound('Inventory item not found');
    }

    await prisma.inventory.delete({
      where: { id },
    });

    return { success: true, message: 'Inventory item deleted' };
  },
};
