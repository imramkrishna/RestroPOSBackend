import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate.js';
import { orderService } from '../services/order.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { OrderStatus } from '@prisma/client';

export const orderController = {
  getAllOrders: asyncHandler(async (req: AuthRequest, res: Response) => {
    const status = req.query.status as OrderStatus | undefined;
    const orders = await orderService.getAllOrders(status ? { status } : undefined);

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
};
