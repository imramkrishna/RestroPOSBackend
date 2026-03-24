import prisma from '../config/database';
import { createError } from '../utils/AppError';
import { TableStatus } from '@prisma/client';

export const tableService = {
  async getAllTables() {
    const tables = await prisma.table.findMany({
      include: {
        orders: {
          where: {
            status: {
              in: ['PENDING', 'COOKING', 'SERVED'],
            },
          },
        },
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
            datetime: {
              gte: new Date(),
            },
          },
          orderBy: {
            datetime: 'asc',
          },
          take: 1,
        },
      },
      orderBy: { tableNumber: 'asc' },
    });

    return tables;
  },

  async getTableById(id: string) {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            status: {
              in: ['PENDING', 'COOKING', 'SERVED'],
            },
          },
        },
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
          },
        },
      },
    });

    if (!table) {
      throw createError.notFound('Table not found');
    }

    return table;
  },

  async createTable(data: { tableNumber: string; capacity: number }) {
    const existing = await prisma.table.findUnique({
      where: { tableNumber: data.tableNumber },
    });

    if (existing) {
      throw createError.conflict('Table number already exists');
    }

    return await prisma.table.create({ data });
  },

  async updateTableStatus(id: string, status: TableStatus) {
    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw createError.notFound('Table not found');
    }

    return await prisma.table.update({
      where: { id },
      data: { status },
    });
  },
};
