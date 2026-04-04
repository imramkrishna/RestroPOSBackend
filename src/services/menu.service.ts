import prisma from '../config/database.js';
import { createError } from '../utils/AppError.js';

export const menuService = {
  async getFullMenu() {
    const categories = await prisma.category.findMany({
      include: {
        menuItems: {
          where: { isAvailable: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return categories;
  },

  async createCategory(data: { name: string; icon?: string; imageUrl?: string }) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw createError.conflict('Category already exists');
    }

    return await prisma.category.create({ data });
  },

  async createMenuItem(data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable?: boolean;
    sizes?: any;
  }) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw createError.notFound('Category not found');
    }

    return await prisma.menuItem.create({
      data: {
        ...data,
        sizes: data.sizes || undefined,
      },
      include: { category: true },
    });
  },

  async updateMenuItem(
    id: string,
    data: {
      categoryId?: string;
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      isAvailable?: boolean;
      sizes?: any;
    }
  ) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw createError.notFound('Menu item not found');
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw createError.notFound('Category not found');
      }
    }

    return await prisma.menuItem.update({
      where: { id },
      data: {
        ...data,
        sizes: data.sizes !== undefined ? data.sizes : undefined,
      },
      include: { category: true },
    });
  },

  async deleteMenuItem(id: string) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw createError.notFound('Menu item not found');
    }

    await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false },
    });

    return { success: true, message: 'Menu item archived' };
  },
};
