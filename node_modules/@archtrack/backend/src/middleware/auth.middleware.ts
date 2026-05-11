import type { NextFunction, Request, Response } from 'express';

import type { Role } from '../types/auth.js';
import { HttpError } from '../utils/http-error.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const requireAuth = (request: Request, _response: Response, next: NextFunction) => {
  const authorization = request.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined;

  if (!token) {
    throw new HttpError(401, 'Authentication required.');
  }

  try {
    request.user = verifyAccessToken(token);
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired access token.');
  }
};

export const requireRole =
  (...allowedRoles: Role[]) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      throw new HttpError(401, 'Authentication required.');
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new HttpError(403, 'You do not have permission to access this resource.');
    }

    next();
  };
