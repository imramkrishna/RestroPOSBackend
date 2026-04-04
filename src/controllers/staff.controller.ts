import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate.js';
import { staffService } from '../services/staff.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const staffController = {
  getAllStaff: asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await staffService.getAllStaff();

    res.status(200).json({
      success: true,
      data: staff,
    });
  }),

  createStaff: asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await staffService.createStaff(req.body);

    res.status(201).json({
      success: true,
      data: staff,
    });
  }),

  getStaffById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const staff = await staffService.getStaffById(id);

    res.status(200).json({
      success: true,
      data: staff,
    });
  }),

  updateStaff: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const staff = await staffService.updateStaff(id, req.body);

    res.status(200).json({
      success: true,
      data: staff,
    });
  }),

  deleteStaff: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await staffService.deleteStaff(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),
};
