import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/env.js';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
  }

  // Unhandled errors
  console.error('ERROR 💥:', err);
  
  return res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};
