import { useCallback, useEffect, useMemo, useState } from 'react';

import { projectApi, taskApi } from '../features/operations/operations-api';
import type { Project, Task } from '../types/operations';

type ScheduleEvent = {
  id: string;
  date: string;
  title: string;
  detail: string;
  type: 'project' | 'milestone' | 'task';
  priority: string;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

export function SchedulePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const load = useCallback(async () => {
    const [nextProjects, nextTasks] = await Promise.all([projectApi.list({ status: 'all' }), taskApi.list({ status: 'all' })]);
    setProjects(nextProjects);
    setTasks(nextTasks);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const events = useMemo<ScheduleEvent[]>(() => {
    const projectEvents = projects.flatMap((project) => [
      project.dueDate
        ? { id: `project-${project.id}`, date: project.dueDate, title: project.projectName, detail: 'Project due', type: 'project' as const, priority: project.priority }
        : undefined,
      ...project.milestones
        .filter((milestone) => milestone.dueDate)
        .map((milestone) => ({
          id: `milestone-${milestone.id}`,
          date: milestone.dueDate!,
          title: milestone.title,
          detail: `${project.projectName} milestone`,
          type: 'milestone' as const,
          priority: project.priority,
        })),
    ]);

    const taskEvents = tasks
      .filter((task) => task.dueDate)
      .map((task) => ({ id: `task-${task.id}`, date: task.dueDate!, title: task.title, detail: 'Task due', type: 'task' as const, priority: task.priority }));

    return [...projectEvents.filter(Boolean), ...taskEvents] as ScheduleEvent[];
  }, [projects, tasks]);

  const monthStart = startOfMonth(currentMonth);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  const calendarEnd = new Date(endOfMonth(currentMonth));
  calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));

  const days = useMemo(() => {
    const values: Date[] = [];
    const cursor = new Date(calendarStart);
    while (cursor <= calendarEnd) {
      values.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return values;
  }, [calendarEnd, calendarStart]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of events) {
      const key = event.date;
      map.set(key, [...(map.get(key) ?? []), event].sort((left, right) => left.title.localeCompare(right.title)));
    }
    return map;
  }, [events]);

  const agenda = useMemo(
    () =>
      events
        .filter((event) => new Date(`${event.date}T00:00:00`) >= new Date())
        .sort((left, right) => left.date.localeCompare(right.date))
        .slice(0, 12),
    [events],
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Schedule</h2>
            <p className="text-sm text-steel dark:text-slate-400">Project due dates, milestones, and task deadlines in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" onClick={() => setCurrentMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}>Prev</button>
            <p className="min-w-40 text-center text-sm font-semibold text-ink dark:text-white">{currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
            <button className="rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" onClick={() => setCurrentMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}>Next</button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-line bg-line dark:border-slate-800 dark:bg-slate-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-field px-3 py-2 text-xs font-semibold uppercase text-steel dark:bg-slate-950 dark:text-slate-400">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const iso = day.toISOString().slice(0, 10);
            const dayEvents = eventsByDate.get(iso) ?? [];
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            return (
              <div key={iso} className={`min-h-28 bg-white p-2 dark:bg-slate-900 ${isCurrentMonth ? '' : 'opacity-55'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink dark:text-white">{day.getDate()}</p>
                  {dayEvents.length ? <span className="rounded-md bg-field px-2 py-0.5 text-xs text-steel dark:bg-slate-800 dark:text-slate-300">{dayEvents.length}</span> : null}
                </div>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="rounded-md bg-field px-2 py-1 text-xs text-ink dark:bg-slate-800 dark:text-slate-200">
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="truncate text-steel dark:text-slate-400">{event.detail}</p>
                    </div>
                  ))}
                  {dayEvents.length > 3 ? <p className="text-xs text-steel dark:text-slate-400">+{dayEvents.length - 3} more</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-ink dark:text-white">Upcoming Agenda</h2>
        <div className="mt-5 space-y-3">
          {agenda.map((event) => (
            <div key={event.id} className="rounded-md border border-line px-3 py-3 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-ink dark:text-white">{event.title}</p>
                <span className="rounded-md bg-field px-2 py-1 text-xs capitalize text-steel dark:bg-slate-800 dark:text-slate-300">{event.type}</span>
              </div>
              <p className="mt-1 text-sm text-steel dark:text-slate-400">{event.detail}</p>
              <p className="mt-1 text-xs text-steel dark:text-slate-400">{event.date}</p>
            </div>
          ))}
          {!agenda.length ? <p className="py-6 text-center text-sm text-steel dark:text-slate-400">No upcoming scheduled work yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
