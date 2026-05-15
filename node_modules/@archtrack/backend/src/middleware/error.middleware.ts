import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { HttpError } from '../utils/http-error.js';

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (error instanceof ZodError) {
    response.status(400).json({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed.',
      issues: error.flatten(),
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      code: error.code ?? 'HTTP_ERROR',
      message: error.message,
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    code: 'UNEXPECTED_SERVER_ERROR',
    message: 'Unexpected server error.',
  });
};
