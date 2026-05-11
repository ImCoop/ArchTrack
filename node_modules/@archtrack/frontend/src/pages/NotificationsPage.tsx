import { Bell, CheckCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { notificationApi } from '../features/notifications/notification-api';
import type { Notification, NotificationPreferences } from '../types/notification';

const typeLabels: Record<Notification['type'], string> = {
  assignment: 'Assignment',
  deadline: 'Deadline',
  mention: 'Mention',
  system: 'System',
  workflow: 'Workflow',
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>();

  const load = useCallback(async () => {
    const [nextNotifications, nextPreferences] = await Promise.all([
      notificationApi.list(),
      notificationApi.getPreferences(),
    ]);
    setNotifications(nextNotifications);
    setPreferences(nextPreferences);
  }, []);

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

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Notifications</h2>
            <p className="text-sm text-steel dark:text-slate-400">Assignment alerts, workflow updates, and reminders.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-steel dark:border-slate-700 dark:text-slate-300" onClick={() => void markAllRead()} type="button">
            <CheckCheck size={17} />
            Mark all read
          </button>
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
    </div>
  );
}
