import { createApp } from './app.js';
import { env } from './config/env.js';
import { startNotificationWorker } from './services/notification.worker.js';
const app = createApp();
startNotificationWorker();
app.listen(env.API_PORT, () => {
    console.log(`ArchTrack API listening on port ${env.API_PORT}`);
});
