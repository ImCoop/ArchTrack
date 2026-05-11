import { env } from '../config/env.js';
import { notificationService } from './notification.service.js';

export const startNotificationWorker = () => {
  if (env.EMAIL_QUEUE_INTERVAL_MS === 0) {
    return undefined;
  }

  const timer = setInterval(() => {
    void notificationService.processEmailQueue().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Notification email queue failed.';
      console.error(message);
    });
  }, env.EMAIL_QUEUE_INTERVAL_MS);

  timer.unref();
  return timer;
};
