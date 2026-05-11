import { init } from '@instantdb/admin';
import { env } from './env.js';
export const isInstantConfigured = () => Boolean(env.INSTANT_APP_ID && env.INSTANT_APP_ADMIN_TOKEN);
export const instantDb = isInstantConfigured()
    ? init({
        appId: env.INSTANT_APP_ID,
        adminToken: env.INSTANT_APP_ADMIN_TOKEN,
    })
    : undefined;
