export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: true) {
    super(message); // we use super in subclass(AppError is a subclass from Error class) to call parent class, otherwise it throws error.
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor); 
  }
}

export const createError = {
  badRequest: (message: string) => new AppError(message, 400, true),
  unauthorized: (message: string) => new AppError(message, 401, true),
  forbidden: (message: string) => new AppError(message, 403, true),
  notFound: (message: string) => new AppError(message, 404, true),
  conflict: (message: string) => new AppError(message, 409, true),
  internal: (message: string) => new AppError(message, 500, true),
};
