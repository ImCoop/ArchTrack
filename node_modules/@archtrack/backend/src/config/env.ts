import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '../../.env.local'),
  path.resolve(process.cwd(), 'apps/backend/.env'),
  path.resolve(process.cwd(), 'apps/backend/.env.local'),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath, override: false });
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  EMAIL_QUEUE_INTERVAL_MS: z.coerce.number().min(0).default(60000),
  INSTANT_APP_ID: z.string().optional(),
  INSTANT_APP_ADMIN_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:5173/oauth/google/callback'),
});

export const env = envSchema.parse(process.env);
