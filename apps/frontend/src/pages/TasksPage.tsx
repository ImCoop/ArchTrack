import { AxiosError } from 'axios';
import { MessageSquarePlus, Plus, Search, Trash2, Users } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { projectApi, taskApi } from '../features/operations/operations-api';
import { priorities, taskStatuses, type Priority, type Project, type Task, type TaskStatus } from '../types/operations';

const statusLabels: Record<TaskStatus, string> = { todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', done: 'Done' };
const priorityLabels: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const emptyTask = { projectId: '', assignedTo: '', title: '', description: '', status: 'todo' as TaskStatus, priority: 'medium' as Priority, dueDate: '', estimatedHours: '', actualHours: '' };
const errorMessage = (error: unknown) =>
  error instanceof AxiosError ? error.response?.data?.message ?? 'Unable to update tasks.' : 'Unable to update tasks.';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [form, setForm] = useState(emptyTask);
  const [editingId, setEditingId] = useState<string>();
  const [commentBody, setCommentBody] = useState('');
  const [commentTaskId, setCommentTaskId] = useState<string>();
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    try {
      const [nextTasks, nextProjects] = await Promise.all([taskApi.list({ search, status }), projectApi.list({ status: 'all' })]);
      setTasks(nextTasks);
      setProjects(nextProjects);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, [search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const projectName = (id?: string) => projects.find((project) => project.id === id)?.projectName ?? 'No project';

  async function saveTask(event: FormEvent) {
    event.preventDefault();
    const payload = {
      projectId: form.projectId || undefined,
      assignedTo: form.assignedTo || undefined,
      title: form.title,
      description: form.description || undefined,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      actualHours: form.actualHours ? Number(form.actualHours) : undefined,
    };

    try {
      if (editingId) await taskApi.update(editingId, payload);
      else await taskApi.create(payload);
      setForm(emptyTask);
      setEditingId(undefined);
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  function editTask(task: Task) {
    setEditingId(task.id);
    setForm({
      projectId: task.projectId ?? '',
      assignedTo: task.assignedTo ?? '',
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ?? '',
      estimatedHours: task.estimatedHours?.toString() ?? '',
      actualHours: task.actualHours?.toString() ?? '',
    });
  }

  async function addComment(task: Task) {
    if (!commentBody.trim()) return;
    await taskApi.addComment(task.id, commentBody);
    setCommentBody('');
    setCommentTaskId(undefined);
    await load();
  }

  async function removeTask(task: Task) {
    await taskApi.delete(task.id);
    await load();
  }

  const grouped = taskStatuses.map((item) => ({ status: item, tasks: tasks.filter((task) => task.status === item) }));

  return (
    <div className="grid gap-5 xl:grid-cols-[0.65fr_1.35fr]">
      <form className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={saveTask}>
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-ink dark:text-white">{editingId ? 'Edit Task' : 'Add Task'}</h2><Users className="text-action" size={22} /></div>
        <div className="mt-5 grid gap-4">
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Task title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">No project linked</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.projectName}</option>)}</select>
          <textarea className="min-h-20 rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Assigned to" value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}>{taskStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
            <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>{priorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}</select>
          </div>
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Estimated hours" type="number" min="0" value={form.estimatedHours} onChange={(event) => setForm({ ...form, estimatedHours: event.target.value })} />
            <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Actual hours" type="number" min="0" value={form.actualHours} onChange={(event) => setForm({ ...form, actualHours: event.target.value })} />
          </div>
        </div>
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p> : null}
        <div className="mt-5 flex gap-2"><button className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit"><Plus size={17} />Save</button>{editingId ? <button className="rounded-md border border-line px-4 py-2 text-steel dark:border-slate-700 dark:text-slate-300" type="button" onClick={() => { setEditingId(undefined); setForm(emptyTask); }}>Cancel</button> : null}</div>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-xl font-semibold text-ink dark:text-white">Tasks</h2><p className="text-sm text-steel dark:text-slate-400">Manage assignments, due dates, estimates, and comments.</p></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
            <label className="flex items-center rounded-md border border-line px-3 dark:border-slate-700"><Search size={17} className="text-steel" /><input className="w-full bg-transparent px-2 py-2 text-sm outline-none" placeholder="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | 'all')}><option value="all">All status</option>{taskStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 2xl:grid-cols-4">
          {grouped.map((group) => (
            <div key={group.status} className="rounded-lg border border-line bg-field p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-ink dark:text-white">{statusLabels[group.status]}</h3><span className="text-xs text-steel dark:text-slate-400">{group.tasks.length}</span></div>
              <div className="space-y-3">
                {group.tasks.map((task) => (
                  <article key={task.id} className="rounded-lg border border-line bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-2"><div><h4 className="font-medium text-ink dark:text-white">{task.title}</h4><p className="text-xs text-steel dark:text-slate-400">{projectName(task.projectId)} · {task.assignedTo || 'Unassigned'}</p></div><span className="rounded-md bg-field px-2 py-1 text-xs dark:bg-slate-800">{priorityLabels[task.priority]}</span></div>
                    <p className="mt-2 text-sm text-steel dark:text-slate-300">{task.description || 'No description'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-steel dark:text-slate-400">{task.dueDate ? <span>Due {task.dueDate}</span> : null}{task.estimatedHours ? <span>Est {task.estimatedHours}h</span> : null}{task.actualHours ? <span>Actual {task.actualHours}h</span> : null}</div>
                    {commentTaskId === task.id ? <div className="mt-3 grid gap-2"><textarea className="min-h-16 rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} /><button className="rounded-md bg-action px-3 py-1.5 text-sm font-semibold text-white" type="button" onClick={() => void addComment(task)}>Add comment</button></div> : null}
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3 dark:border-slate-800"><span className="text-xs text-steel dark:text-slate-400">{task.comments.length} comments</span><div className="flex gap-2"><button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line dark:border-slate-700" type="button" onClick={() => setCommentTaskId(task.id)} aria-label={`Comment on ${task.title}`}><MessageSquarePlus size={15} /></button><button className="rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" onClick={() => editTask(task)}>Edit</button><button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line dark:border-slate-700" type="button" onClick={() => void removeTask(task)} aria-label={`Delete ${task.title}`}><Trash2 size={15} /></button></div></div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
