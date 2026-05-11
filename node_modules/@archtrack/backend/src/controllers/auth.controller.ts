import type { Request, Response } from 'express';

import { authService } from '../services/auth.service.js';
import { loginSchema, registerSchema } from '../utils/auth.schemas.js';
import { z } from 'zod';

const refreshCookieName = 'archtrack_refresh';

const setRefreshCookie = (response: Response, refreshToken: string) => {
  response.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/v1/auth',
  });
};

const clearRefreshCookie = (response: Response) => {
  response.clearCookie(refreshCookieName, {
    path: '/api/v1/auth',
  });
};

const sendAuthResponse = (
  response: Response,
  result: Awaited<ReturnType<typeof authService.login>>,
  statusCode = 200,
) => {
  setRefreshCookie(response, result.refreshToken);
  response.status(statusCode).json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const authController = {
  async register(request: Request, response: Response) {
    const input = registerSchema.parse(request.body);
    const result = await authService.register(input);
    sendAuthResponse(response, result, 201);
  },

  async login(request: Request, response: Response) {
    const input = loginSchema.parse(request.body);
    const result = await authService.login(input);
    sendAuthResponse(response, result);
  },

  async googleUrl(_request: Request, response: Response) {
    response.json({
      authUrl: authService.getGoogleAuthUrl(),
    });
  },

  async googleCallback(request: Request, response: Response) {
    const input = z.object({ code: z.string().min(1) }).parse(request.body);
    const result = await authService.loginWithGoogleCode(input.code);
    sendAuthResponse(response, result);
  },

  async refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.[refreshCookieName] ?? request.body?.refreshToken;
    const result = await authService.refresh(refreshToken);
    sendAuthResponse(response, result);
  },

  async logout(request: Request, response: Response) {
    const refreshToken = request.cookies?.[refreshCookieName] ?? request.body?.refreshToken;
    await authService.logout(refreshToken);
    clearRefreshCookie(response);
    response.status(204).send();
  },

  async me(request: Request, response: Response) {
    const user = await authService.getCurrentUser(request.user!.id);

    response.json({
      user,
    });
  },

  async adminCheck(request: Request, response: Response) {
    response.json({
      message: 'Admin permission confirmed.',
      user: request.user,
    });
  },
};
