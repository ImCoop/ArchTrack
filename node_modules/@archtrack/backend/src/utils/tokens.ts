import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import { env } from '../config/env.js';
import type { AuthenticatedUser } from '../types/auth.js';

interface JwtPayload extends AuthenticatedUser {
  type: 'access';
}

export const createAccessToken = (user: AuthenticatedUser) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
      subject: user.id,
    },
  );

export const verifyAccessToken = (token: string): AuthenticatedUser => {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };
};

export const createOpaqueRefreshToken = () => crypto.randomBytes(48).toString('base64url');

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
