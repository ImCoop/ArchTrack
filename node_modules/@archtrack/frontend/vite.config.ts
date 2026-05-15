import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const rootEnvDir = path.resolve(__dirname, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootEnvDir, '');
  const frontendPort = Number(env.FRONTEND_PORT ?? 5173);
  const apiOrigin = env.API_ORIGIN ?? `http://localhost:${env.API_PORT ?? '4000'}`;
  const apiUrl = env.VITE_API_URL ?? `${apiOrigin}/api/v1`;
  const instantAppId = env.VITE_INSTANT_APP_ID ?? env.INSTANT_APP_ID ?? '';

  return {
    envDir: rootEnvDir,
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_INSTANT_APP_ID': JSON.stringify(instantAppId),
    },
    server: {
      host: '0.0.0.0',
      port: frontendPort,
    },
    preview: {
      host: '0.0.0.0',
      port: frontendPort,
    },
  };
});
