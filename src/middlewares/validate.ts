import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createError } from '../utils/AppError';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as {
        body: Request['body'];
      };

      req.body = parsed.body;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return next(
          createError.badRequest(
            JSON.stringify(errorMessages)
          )
        );
      }
      next(error);
    }
  };
};
