import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate.js';
import { reservationService } from '../services/reservation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ReservationStatus } from '@prisma/client';

export const reservationController = {
  getAllReservations: asyncHandler(async (req: AuthRequest, res: Response) => {
    const status = req.query.status as ReservationStatus | undefined;
    const reservations = await reservationService.getAllReservations(
      status ? { status } : undefined
    );

    res.status(200).json({
      success: true,
      data: reservations,
    });
  }),

  createReservation: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = {
      ...req.body,
      datetime: new Date(req.body.datetime),
    };
    const reservation = await reservationService.createReservation(data);

    res.status(201).json({
      success: true,
      data: reservation,
    });
  }),

  getReservationById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const reservation = await reservationService.getReservationById(id);

    res.status(200).json({
      success: true,
      data: reservation,
    });
  }),

  updateReservationStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    const reservation = await reservationService.updateReservationStatus(id, status);

    res.status(200).json({
      success: true,
      data: reservation,
    });
  }),
};
