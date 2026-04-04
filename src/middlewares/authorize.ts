import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate.js';
import { createError } from '../utils/AppError.js';

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError.unauthorized('User not authenticated'));
    }

    const userRole = req.user.role.toUpperCase();
    const normalizedRoles = allowedRoles.map(role => role.toUpperCase());

    if (!normalizedRoles.includes(userRole)) {
      return next(createError.forbidden('Access denied'));
    }

    next();
  };
};
