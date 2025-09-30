import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../errors';

export interface ErrorResponse {
  error: {
    message: string;
    status: number;
    timestamp: string;
    path: string;
  };
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle custom application errors
  if (error instanceof BaseError) {
    const errorResponse: ErrorResponse = {
      error: {
        message: error.message,
        status: error.statusCode,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    };

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          error: {
            message: 'Resource already exists',
            status: 409,
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;

      case 'P2025':
        res.status(404).json({
          error: {
            message: 'Resource not found',
            status: 404,
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: {
        message: error.message,
        status: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
    return;
  }

  // Handle unexpected errors
  res.status(500).json({
    error: {
      message: 'Internal server error',
      status: 500,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
};