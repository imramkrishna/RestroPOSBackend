import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

export const authController = {
  login: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, password } = req.body;
    const result = await authService.login(username, password);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  refresh: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  logout: asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  getMe: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const user = await authService.getMe(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  }),
};
