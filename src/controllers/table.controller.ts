import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import { tableService } from '../services/table.service';
import { asyncHandler } from '../utils/asyncHandler';

export const tableController = {
  getAllTables: asyncHandler(async (req: AuthRequest, res: Response) => {
    const tables = await tableService.getAllTables();

    res.status(200).json({
      success: true,
      data: tables,
    });
  }),

  getTableById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const table = await tableService.getTableById(id);

    res.status(200).json({
      success: true,
      data: table,
    });
  }),

  createTable: asyncHandler(async (req: AuthRequest, res: Response) => {
    const table = await tableService.createTable(req.body);

    res.status(201).json({
      success: true,
      data: table,
    });
  }),

  updateTableStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    const table = await tableService.updateTableStatus(id, status);

    res.status(200).json({
      success: true,
      data: table,
    });
  }),
};
