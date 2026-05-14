import { env } from '../config/env.js';
import { invoiceService } from './business.service.js';
import { notificationService } from './notification.service.js';

interface WorkerStatus {
  emailQueue: {
    lastRunAt?: string;
    lastProcessedCount: number;
    lastError?: string;
  };
  invoiceSweep: {
    lastRunAt?: string;
    lastProcessedCount: number;
    lastError?: string;
  };
}

const workerStatus: WorkerStatus = {
  emailQueue: { lastProcessedCount: 0 },
  invoiceSweep: { lastProcessedCount: 0 },
};

const runEmailQueueJob = async () => {
  workerStatus.emailQueue.lastRunAt = new Date().toISOString();

  try {
    const queue = await notificationService.processEmailQueue();
    workerStatus.emailQueue.lastProcessedCount = queue.length;
    workerStatus.emailQueue.lastError = undefined;
  } catch (error) {
    workerStatus.emailQueue.lastError = error instanceof Error ? error.message : 'Notification email queue failed.';
    throw error;
  }
};

const runInvoiceSweepJob = async () => {
  workerStatus.invoiceSweep.lastRunAt = new Date().toISOString();

  try {
    workerStatus.invoiceSweep.lastProcessedCount = await invoiceService.markDueInvoicesOverdue();
    workerStatus.invoiceSweep.lastError = undefined;
  } catch (error) {
    workerStatus.invoiceSweep.lastError = error instanceof Error ? error.message : 'Invoice overdue sweep failed.';
    throw error;
  }
};

export const backgroundJobService = {
  getStatus() {
    return workerStatus;
  },

  async runAll() {
    const [queue, summary] = await Promise.all([notificationService.processEmailQueue(), invoiceService.markDueInvoicesOverdue()]);
    workerStatus.emailQueue.lastRunAt = new Date().toISOString();
    workerStatus.emailQueue.lastProcessedCount = queue.length;
    workerStatus.emailQueue.lastError = undefined;
    workerStatus.invoiceSweep.lastRunAt = new Date().toISOString();
    workerStatus.invoiceSweep.lastProcessedCount = summary;
    workerStatus.invoiceSweep.lastError = undefined;
    return { emailQueue: queue, overdueInvoices: summary };
  },
};

export const startNotificationWorker = () => {
  if (env.EMAIL_QUEUE_INTERVAL_MS === 0 && env.JOB_SWEEP_INTERVAL_MS === 0) {
    return undefined;
  }

  const timers: NodeJS.Timeout[] = [];

  if (env.EMAIL_QUEUE_INTERVAL_MS > 0) {
    const timer = setInterval(() => {
      void runEmailQueueJob().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Notification email queue failed.';
        console.error(message);
      });
    }, env.EMAIL_QUEUE_INTERVAL_MS);
    timer.unref();
    timers.push(timer);
  }

  if (env.JOB_SWEEP_INTERVAL_MS > 0) {
    const timer = setInterval(() => {
      void runInvoiceSweepJob().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Invoice overdue sweep failed.';
        console.error(message);
      });
    }, env.JOB_SWEEP_INTERVAL_MS);
    timer.unref();
    timers.push(timer);
  }

  return timers;
};
