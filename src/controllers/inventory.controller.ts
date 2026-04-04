import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate.js';
import { inventoryService } from '../services/inventory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const inventoryController = {
  getAllInventory: asyncHandler(async (req: AuthRequest, res: Response) => {
    const inventory = await inventoryService.getAllInventory();

    res.status(200).json({
      success: true,
      data: inventory,
    });
  }),

  createInventoryItem: asyncHandler(async (req: AuthRequest, res: Response) => {
    const item = await inventoryService.createInventoryItem(req.body);

    res.status(201).json({
      success: true,
      data: item,
    });
  }),

  getInventoryById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const item = await inventoryService.getInventoryById(id);

    res.status(200).json({
      success: true,
      data: item,
    });
  }),

  updateInventoryQuantity: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { quantity } = req.body;
    const item = await inventoryService.updateInventoryQuantity(id, quantity);

    res.status(200).json({
      success: true,
      data: item,
    });
  }),

  getLowStockAlerts: asyncHandler(async (req: AuthRequest, res: Response) => {
    const alerts = await inventoryService.getLowStockAlerts();

    res.status(200).json({
      success: true,
      data: alerts,
    });
  }),

  deleteInventoryItem: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await inventoryService.deleteInventoryItem(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),
};
