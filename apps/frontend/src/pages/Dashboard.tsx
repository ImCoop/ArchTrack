import { useCallback, useEffect, useMemo, useState } from 'react';

import { activityApi } from '../features/activity/activity-api';
import { invoiceApi, quoteApi, timeApi } from '../features/business/business-api';
import { notificationApi } from '../features/notifications/notification-api';
import { customerApi, projectApi, taskApi } from '../features/operations/operations-api';
import type { ActivityLog } from '../types/activity';
import type { Invoice, Quote, TimeEntry } from '../types/business';
import type { Customer, Project, Task } from '../types/operations';

interface DashboardState {
  projects: Project[];
  tasks: Task[];
  quotes: Quote[];
  invoices: Invoice[];
  timeEntries: TimeEntry[];
  notifications: Array<{ id: string; readAt?: string }>;
  customers: Customer[];
  activity: ActivityLog[];
}

interface UpcomingEvent {
  id: string;
  date: string;
  title: string;
  detail: string;
  priority: Project['priority'];
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const startOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const daysUntil = (value?: string) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const today = new Date();
  const target = new Date(`${value}T00:00:00`);
  return Math.ceil((target.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
};

export function Dashboard() {
  const [data, setData] = useState<DashboardState>({
    projects: [],
    tasks: [],
    quotes: [],
    invoices: [],
    timeEntries: [],
    notifications: [],
    customers: [],
    activity: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [projects, tasks, quotes, invoices, timeEntries, notifications, customers, activity] = await Promise.all([
      projectApi.list({ status: 'all' }),
      taskApi.list({ status: 'all' }),
      quoteApi.list({ status: 'all' }),
      invoiceApi.list({ status: 'all' }),
      timeApi.list({ status: 'all' }),
      notificationApi.list({ readStatus: 'all' }),
      customerApi.list({ status: 'all' }),
      activityApi.list({ limit: 8 }),
    ]);

    setData({ projects, tasks, quotes, invoices, timeEntries, notifications, customers, activity });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const activeProjects = data.projects.filter((project) => project.status === 'active').length;
    const dueThisWeek = data.tasks.filter((task) => {
      const delta = daysUntil(task.dueDate);
      return delta >= 0 && delta <= 7 && task.status !== 'done';
    }).length;
    const openQuoteValue = data.quotes.filter((quote) => ['draft', 'sent', 'approved'].includes(quote.status)).reduce((sum, quote) => sum + quote.total, 0);
    const overdueInvoices = data.invoices.filter((invoice) => invoice.status === 'overdue').reduce((sum, invoice) => sum + invoice.total, 0);
    const monthStart = startOfMonth().toISOString().slice(0, 10);
    const billableHours = data.timeEntries.filter((entry) => entry.billable && entry.entryDate >= monthStart).reduce((sum, entry) => sum + entry.hours, 0);
    const unreadAlerts = data.notifications.filter((notification) => !notification.readAt).length;
    const sentQuotes = data.quotes.filter((quote) => ['sent', 'approved', 'converted'].includes(quote.status)).length;
    const wonQuotes = data.quotes.filter((quote) => ['approved', 'converted'].includes(quote.status)).length;
    const quoteConversionRate = sentQuotes ? Math.round((wonQuotes / sentQuotes) * 100) : 0;
    const outstandingInvoiceValue = data.invoices.filter((invoice) => ['sent', 'overdue'].includes(invoice.status)).reduce((sum, invoice) => sum + invoice.total, 0);

    return { activeProjects, dueThisWeek, openQuoteValue, overdueInvoices, billableHours, unreadAlerts, quoteConversionRate, outstandingInvoiceValue };
  }, [data]);

  const upcoming = useMemo(() => {
    const projectEvents: UpcomingEvent[] = [];
    for (const project of data.projects) {
      if (project.dueDate) {
        projectEvents.push({
          id: `project-${project.id}`,
          date: project.dueDate,
          title: project.projectName,
          detail: 'Project due',
          priority: project.priority,
        });
      }

      for (const milestone of project.milestones) {
        if (!milestone.dueDate || milestone.completed) continue;
        projectEvents.push({
          id: `milestone-${milestone.id}`,
          date: milestone.dueDate,
          title: milestone.title,
          detail: project.projectName,
          priority: project.priority,
        });
      }
    }

    const taskEvents: UpcomingEvent[] = data.tasks
      .filter((task) => task.dueDate && task.status !== 'done')
      .map((task) => ({ id: `task-${task.id}`, date: task.dueDate!, title: task.title, detail: 'Task due', priority: task.priority }));

    return [...projectEvents, ...taskEvents]
      .filter((event) => daysUntil(event.date) >= 0)
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(0, 8);
  }, [data.projects, data.tasks]);

  const pipeline = useMemo(
    () => [
      { label: 'Draft quotes', count: data.quotes.filter((quote) => quote.status === 'draft').length },
      { label: 'Sent quotes', count: data.quotes.filter((quote) => quote.status === 'sent').length },
      { label: 'Paid invoices', count: data.invoices.filter((invoice) => invoice.status === 'paid').length },
      { label: 'Blocked tasks', count: data.tasks.filter((task) => task.status === 'blocked').length },
    ],
    [data.invoices, data.quotes, data.tasks],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active projects', value: String(metrics.activeProjects), subtext: `${data.customers.length} customers in CRM` },
          { label: 'Due this week', value: String(metrics.dueThisWeek), subtext: `${data.tasks.length} tracked tasks` },
          { label: 'Open quotes', value: currency.format(metrics.openQuoteValue), subtext: `${metrics.quoteConversionRate}% win rate` },
          { label: 'Unread alerts', value: String(metrics.unreadAlerts), subtext: `${currency.format(metrics.overdueInvoices)} overdue` },
        ].map((item) => (
          <article key={item.label} className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-steel dark:text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink dark:text-white">{isLoading ? '--' : item.value}</p>
            <p className="mt-2 text-sm text-steel dark:text-slate-400">{item.subtext}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink dark:text-white">Financial Snapshot</h2>
              <p className="text-sm text-steel dark:text-slate-400">Quote pipeline, outstanding revenue, and current billing pace.</p>
            </div>
            <div className="text-right text-sm text-steel dark:text-slate-400">
              <p>Outstanding</p>
              <p className="mt-1 text-lg font-semibold text-ink dark:text-white">{currency.format(metrics.outstandingInvoiceValue)}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <article className="rounded-md bg-field p-4 dark:bg-slate-800">
              <p className="text-sm text-steel dark:text-slate-400">Billable hours this month</p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-white">{metrics.billableHours.toFixed(1)}h</p>
            </article>
            <article className="rounded-md bg-field p-4 dark:bg-slate-800">
              <p className="text-sm text-steel dark:text-slate-400">Quote conversion</p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-white">{metrics.quoteConversionRate}%</p>
            </article>
            <article className="rounded-md bg-field p-4 dark:bg-slate-800">
              <p className="text-sm text-steel dark:text-slate-400">Overdue invoices</p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-white">{currency.format(metrics.overdueInvoices)}</p>
            </article>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {pipeline.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm dark:border-slate-800">
                <span className="text-steel dark:text-slate-400">{item.label}</span>
                <span className="font-semibold text-ink dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-ink dark:text-white">Upcoming Deadlines</h2>
          <div className="mt-5 space-y-3">
            {upcoming.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-4 rounded-md border border-line px-3 py-3 dark:border-slate-800">
                <div>
                  <p className="font-medium text-ink dark:text-white">{event.title}</p>
                  <p className="text-sm text-steel dark:text-slate-400">{event.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink dark:text-white">{event.date}</p>
                  <p className="text-xs capitalize text-steel dark:text-slate-400">{event.priority}</p>
                </div>
              </div>
            ))}
            {!upcoming.length ? <p className="py-6 text-center text-sm text-steel dark:text-slate-400">No upcoming due dates on the board.</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-ink dark:text-white">Recent Activity</h2>
          <div className="mt-5 space-y-3">
            {data.activity.map((entry) => (
              <div key={entry.id} className="rounded-md border border-line px-3 py-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-ink dark:text-white">{entry.summary}</p>
                  <span className="rounded-md bg-field px-2 py-1 text-xs uppercase text-steel dark:bg-slate-800 dark:text-slate-300">{entry.entityType.replace('_', ' ')}</span>
                </div>
                <p className="mt-1 text-sm text-steel dark:text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!data.activity.length ? <p className="py-6 text-center text-sm text-steel dark:text-slate-400">No activity recorded yet.</p> : null}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-ink dark:text-white">Team Load</h2>
          <div className="mt-5 space-y-4">
            {[
              { label: 'In progress tasks', value: data.tasks.filter((task) => task.status === 'in_progress').length },
              { label: 'Tasks awaiting assignment', value: data.tasks.filter((task) => !task.assignedTo).length },
              { label: 'Projects on hold', value: data.projects.filter((project) => project.status === 'on_hold').length },
              { label: 'Submitted time entries', value: data.timeEntries.filter((entry) => entry.status === 'submitted').length },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-line pb-4 last:border-b-0 last:pb-0 dark:border-slate-800">
                <p className="text-sm text-steel dark:text-slate-400">{item.label}</p>
                <p className="text-lg font-semibold text-ink dark:text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
