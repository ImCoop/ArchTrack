import { Bell, CheckCheck, Mail, Play, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext';
import { notificationApi } from '../features/notifications/notification-api';
import type { EmailQueueItem, EmailQueueSummary, Notification, NotificationPreferences, WorkerStatus } from '../types/notification';

const typeLabels: Record<Notification['type'], string> = {
  assignment: 'Assignment',
  deadline: 'Deadline',
  mention: 'Mention',
  system: 'System',
  workflow: 'Workflow',
};

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>();
  const [summary, setSummary] = useState<EmailQueueSummary>();
  const [queue, setQueue] = useState<EmailQueueItem[]>([]);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>();
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    const [nextNotifications, nextPreferences] = await Promise.all([
      notificationApi.list(),
      notificationApi.getPreferences(),
    ]);
    setNotifications(nextNotifications);
    setPreferences(nextPreferences);

    if (isAdmin) {
      const [nextSummary, nextQueue, nextStatus] = await Promise.all([
        notificationApi.emailQueueSummary(),
        notificationApi.listEmailQueue(),
        notificationApi.workerStatus(),
      ]);
      setSummary(nextSummary);
      setQueue(nextQueue.slice(0, 8));
      setWorkerStatus(nextStatus);
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    await notificationApi.markAllRead();
    await load();
  }

  async function togglePreference(key: keyof Omit<NotificationPreferences, 'userId'>) {
    if (!preferences) return;
    const next = await notificationApi.updatePreferences({ [key]: !preferences[key] });
    setPreferences(next);
  }

  async function processEmailQueue() {
    await notificationApi.processEmailQueue();
    await load();
  }

  async function runJobs() {
    await notificationApi.runJobs();
    await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Notifications</h2>
            <p className="text-sm text-steel dark:text-slate-400">Assignment alerts, workflow updates, reminders, and mail delivery status.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-steel dark:border-slate-700 dark:text-slate-300" onClick={() => void markAllRead()} type="button">
            <CheckCheck size={17} />
            Mark all read
          </button>
        </div>

        <div className="mt-4 rounded-md border border-dashed border-line px-3 py-3 text-sm dark:border-slate-700">
          <div className="flex items-center gap-2 text-ink dark:text-white"><Mail size={16} /> Gmail integration</div>
          <p className="mt-1 text-steel dark:text-slate-400">{user?.googleId ? 'Your Google account is linked. Email notifications and Drive-backed uploads are available.' : 'Link Google from the sign-in flow again if you want Gmail sending and Drive folder features.'}</p>
        </div>

        <div className="mt-5 space-y-3">
          {notifications.map((notification) => (
            <article key={notification.id} className="rounded-lg border border-line p-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-md bg-field px-2 py-1 text-xs text-steel dark:bg-slate-800 dark:text-slate-300">{typeLabels[notification.type]}</span>
                  <h3 className="mt-3 font-semibold text-ink dark:text-white">{notification.title}</h3>
                  <p className="mt-1 text-sm text-steel dark:text-slate-300">{notification.message}</p>
                  {notification.link ? <Link className="mt-3 inline-flex text-sm font-semibold text-action" to={notification.link}>Open</Link> : null}
                </div>
                <button className="rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" disabled={Boolean(notification.readAt)} onClick={() => void notificationApi.markRead(notification.id).then(load)} type="button">
                  {notification.readAt ? 'Read' : 'Mark read'}
                </button>
              </div>
            </article>
          ))}
          {!notifications.length ? <p className="py-8 text-center text-sm text-steel dark:text-slate-400">No notifications yet.</p> : null}
        </div>
      </section>

      <div className="grid gap-5">
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Bell className="text-action" size={20} />
            <h2 className="text-lg font-semibold text-ink dark:text-white">Preferences</h2>
          </div>
          <div className="mt-5 space-y-3">
            {preferences
              ? (['inApp', 'email', 'assignmentAlerts', 'deadlineReminders', 'mentionAlerts'] as const).map((key) => (
                  <label key={key} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-sm dark:border-slate-800">
                    <span className="capitalize text-ink dark:text-slate-200">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <input checked={preferences[key]} onChange={() => void togglePreference(key)} type="checkbox" />
                  </label>
                ))
              : null}
          </div>
        </section>

        {isAdmin ? (
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-ink dark:text-white">Background Jobs</h2>
                <p className="text-sm text-steel dark:text-slate-400">Email queue and overdue invoice sweep.</p>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm dark:border-slate-700" type="button" onClick={() => void processEmailQueue()}><Play size={15} />Process mail</button>
                <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm dark:border-slate-700" type="button" onClick={() => void runJobs()}><RefreshCcw size={15} />Run all</button>
              </div>
            </div>

            {summary ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-line px-3 py-3 dark:border-slate-800"><p className="text-xs uppercase text-steel dark:text-slate-400">Queued</p><p className="mt-1 text-xl font-semibold text-ink dark:text-white">{summary.queued}</p></div>
                <div className="rounded-md border border-line px-3 py-3 dark:border-slate-800"><p className="text-xs uppercase text-steel dark:text-slate-400">Sent</p><p className="mt-1 text-xl font-semibold text-ink dark:text-white">{summary.sent}</p></div>
                <div className="rounded-md border border-line px-3 py-3 dark:border-slate-800"><p className="text-xs uppercase text-steel dark:text-slate-400">Failed</p><p className="mt-1 text-xl font-semibold text-ink dark:text-white">{summary.failed}</p></div>
              </div>
            ) : null}

            {workerStatus ? (
              <div className="mt-4 space-y-2 text-sm">
                <div className="rounded-md border border-line px-3 py-2 dark:border-slate-800">
                  <p className="font-medium text-ink dark:text-white">Email queue worker</p>
                  <p className="text-steel dark:text-slate-400">Last run: {workerStatus.emailQueue.lastRunAt ?? 'Never'} · Processed: {workerStatus.emailQueue.lastProcessedCount}</p>
                  {workerStatus.emailQueue.lastError ? <p className="text-red-600 dark:text-red-300">{workerStatus.emailQueue.lastError}</p> : null}
                </div>
                <div className="rounded-md border border-line px-3 py-2 dark:border-slate-800">
                  <p className="font-medium text-ink dark:text-white">Invoice sweep</p>
                  <p className="text-steel dark:text-slate-400">Last run: {workerStatus.invoiceSweep.lastRunAt ?? 'Never'} · Updated: {workerStatus.invoiceSweep.lastProcessedCount}</p>
                  {workerStatus.invoiceSweep.lastError ? <p className="text-red-600 dark:text-red-300">{workerStatus.invoiceSweep.lastError}</p> : null}
                </div>
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              {queue.map((item) => (
                <div key={item.id} className="rounded-md border border-line px-3 py-2 text-sm dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink dark:text-white">{item.status}</span>
                    <span className="text-xs text-steel dark:text-slate-400">{item.attempts} attempt{item.attempts === 1 ? '' : 's'}</span>
                  </div>
                  {item.lastError ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{item.lastError}</p> : null}
                </div>
              ))}
              {!queue.length ? <p className="text-sm text-steel dark:text-slate-400">No email queue items yet.</p> : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
