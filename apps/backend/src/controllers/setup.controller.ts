import type { Response } from 'express';

import { env } from '../config/env.js';
import { isInstantConfigured } from '../config/instant.js';

export const setupController = {
  status(_request: unknown, response: Response) {
    response.json({
      instantDb: {
        configured: isInstantConfigured(),
        appIdPresent: Boolean(env.INSTANT_APP_ID),
        adminTokenPresent: Boolean(env.INSTANT_APP_ADMIN_TOKEN),
      },
      googleOAuth: {
        configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        clientIdPresent: Boolean(env.GOOGLE_CLIENT_ID),
        clientSecretPresent: Boolean(env.GOOGLE_CLIENT_SECRET),
        redirectUri: env.GOOGLE_REDIRECT_URI,
      },
    });
  },
};
