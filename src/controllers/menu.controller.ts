import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate.js';
import { menuService } from '../services/menu.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const menuController = {
  getFullMenu: asyncHandler(async (req: AuthRequest, res: Response) => {
    const menu = await menuService.getFullMenu();

    res.status(200).json({
      success: true,
      data: menu,
    });
  }),

  createCategory: asyncHandler(async (req: AuthRequest, res: Response) => {
    const category = await menuService.createCategory(req.body);

    res.status(201).json({
      success: true,
      data: category,
    });
  }),

  createMenuItem: asyncHandler(async (req: AuthRequest, res: Response) => {
    const menuItem = await menuService.createMenuItem(req.body);

    res.status(201).json({
      success: true,
      data: menuItem,
    });
  }),

  updateMenuItem: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const menuItem = await menuService.updateMenuItem(id, req.body);

    res.status(200).json({
      success: true,
      data: menuItem,
    });
  }),

  deleteMenuItem: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await menuService.deleteMenuItem(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),
};
