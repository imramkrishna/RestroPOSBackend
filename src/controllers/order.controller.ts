import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate.js';
import { orderService } from '../services/order.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  DeliveryProvider,
  OrderChannel,
  OrderStatus,
  SettlementStatus,
} from '@prisma/client';

export const orderController = {
  getAllOrders: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query as Record<string, string | undefined>;
    const orders = await orderService.getAllOrders({
      status: query.status as OrderStatus | undefined,
      channel: query.channel as OrderChannel | undefined,
      provider: query.provider as DeliveryProvider | undefined,
      settlementStatus: query.settlementStatus as SettlementStatus | undefined,
      weekStart: query.weekStart,
      weekEnd: query.weekEnd,
    });

    res.status(200).json({
      success: true,
      data: orders,
    });
  }),

  createOrder: asyncHandler(async (req: AuthRequest, res: Response) => {
    const staffId = req.user!.id;
    const order = await orderService.createOrder(staffId, req.body);

    res.status(201).json({
      success: true,
      data: order,
    });
  }),

  getOrderById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const order = await orderService.getOrderById(id);

    res.status(200).json({
      success: true,
      data: order,
    });
  }),

  updateOrderStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(id, status);

    res.status(200).json({
      success: true,
      data: order,
    });
  }),

  addOrderItems: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { items } = req.body;
    const order = await orderService.addOrderItems(id, items);

    res.status(200).json({
      success: true,
      data: order,
    });
  }),

  processPayment: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { paymentMethod } = req.body;
    const order = await orderService.processPayment(id, paymentMethod);

    res.status(200).json({
      success: true,
      data: order,
    });
  }),

  getOnlineSettlementSummary: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query as Record<string, string | undefined>;
    const summary = await orderService.getOnlineSettlementSummary({
      provider: query.provider as DeliveryProvider | undefined,
      weekStart: query.weekStart!,
      weekEnd: query.weekEnd!,
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  }),

  createSettlementBatch: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { provider, weekStart, weekEnd, notes } = req.body;
    const batch = await orderService.createSettlementBatch({
      provider,
      weekStart,
      weekEnd,
      notes,
    });

    res.status(201).json({
      success: true,
      data: batch,
    });
  }),
};
