import prisma from '../config/database.js';
import { createError } from '../utils/AppError.js';
import { ReservationStatus } from '@prisma/client';

export const reservationService = {
  async getAllReservations(filters?: { status?: ReservationStatus }) {
    const where = filters?.status ? { status: filters.status } : {};

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        table: true,
      },
      orderBy: { datetime: 'asc' },
    });

    return reservations;
  },

  async createReservation(data: {
    tableId: string;
    customerName: string;
    phone: string;
    guestCount: number;
    datetime: Date;
    notes?: string;
  }) {
    const table = await prisma.table.findUnique({
      where: { id: data.tableId },
    });

    if (!table) {
      throw createError.notFound('Table not found');
    }

    if (data.guestCount > table.capacity) {
      throw createError.badRequest(
        `Guest count exceeds table capacity (${table.capacity})`
      );
    }

    const existingReservation = await prisma.reservation.findFirst({
      where: {
        tableId: data.tableId,
        datetime: {
          gte: new Date(new Date(data.datetime).getTime() - 2 * 60 * 60 * 1000),
          lte: new Date(new Date(data.datetime).getTime() + 2 * 60 * 60 * 1000),
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (existingReservation) {
      throw createError.conflict('Table is already reserved for this time slot');
    }

    const reservation = await prisma.reservation.create({
      data,
      include: { table: true },
    });

    return reservation;
  },

  async getReservationById(id: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!reservation) {
      throw createError.notFound('Reservation not found');
    }

    return reservation;
  },

  async updateReservationStatus(id: string, status: ReservationStatus) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw createError.notFound('Reservation not found');
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: { table: true },
    });

    if (status === 'CONFIRMED') {
      await prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: 'RESERVED' },
      });
    } else if (status === 'CANCELLED' || status === 'COMPLETED') {
      const activeReservations = await prisma.reservation.count({
        where: {
          tableId: reservation.tableId,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      });

      if (activeReservations === 0) {
        await prisma.table.update({
          where: { id: reservation.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    return updatedReservation;
  },
};
