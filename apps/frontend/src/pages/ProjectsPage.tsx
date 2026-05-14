import { AxiosError } from 'axios';
import { CalendarDays, ExternalLink, Flag, FolderSync, Link2, Plus, Search, Trash2 } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { customerApi, projectApi } from '../features/operations/operations-api';
import { priorities, projectStatuses, type Customer, type Priority, type Project, type ProjectStatus } from '../types/operations';

const statusLabels: Record<ProjectStatus, string> = { planning: 'Planning', active: 'Active', on_hold: 'On Hold', completed: 'Completed' };
const priorityLabels: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const emptyProject = { customerId: '', projectName: '', description: '', status: 'planning' as ProjectStatus, priority: 'medium' as Priority, dueDate: '', assignedTo: '' };
const errorMessage = (error: unknown) =>
  error instanceof AxiosError ? error.response?.data?.message ?? 'Unable to update projects.' : 'Unable to update projects.';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [form, setForm] = useState(emptyProject);
  const [editingId, setEditingId] = useState<string>();
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [error, setError] = useState<string>();
  const [linkingProjectId, setLinkingProjectId] = useState<string>();
  const [attachFolderValue, setAttachFolderValue] = useState('');

  const load = useCallback(async () => {
    try {
      const [nextProjects, nextCustomers] = await Promise.all([
        projectApi.list({ search, status }),
        customerApi.list({ status: 'all' }),
      ]);
      setProjects(nextProjects);
      setCustomers(nextCustomers);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, [search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const customerName = (id?: string) => customers.find((customer) => customer.id === id)?.companyName ?? 'No customer';

  async function saveProject(event: FormEvent) {
    event.preventDefault();
    const payload = { ...form, customerId: form.customerId || undefined, dueDate: form.dueDate || undefined, assignedTo: form.assignedTo || undefined };
    try {
      if (editingId) await projectApi.update(editingId, payload);
      else await projectApi.create(payload);
      setForm(emptyProject);
      setEditingId(undefined);
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  function editProject(project: Project) {
    setEditingId(project.id);
    setForm({
      customerId: project.customerId ?? '',
      projectName: project.projectName,
      description: project.description ?? '',
      status: project.status,
      priority: project.priority,
      dueDate: project.dueDate ?? '',
      assignedTo: project.assignedTo ?? '',
    });
  }

  async function addMilestone(project: Project) {
    if (!milestoneTitle.trim()) return;
    await projectApi.addMilestone(project.id, { title: milestoneTitle, completed: false });
    setMilestoneTitle('');
    await load();
  }

  async function removeProject(project: Project) {
    await projectApi.delete(project.id);
    await load();
  }

  async function createDriveFolder(project: Project) {
    setLinkingProjectId(project.id);
    setError(undefined);
    try {
      await projectApi.createDriveFolder(project.id);
      await load();
    } catch (linkError) {
      setError(errorMessage(linkError));
    } finally {
      setLinkingProjectId(undefined);
    }
  }

  async function attachDriveFolder(project: Project) {
    const value = attachFolderValue.trim();
    if (!value) return;
    setLinkingProjectId(project.id);
    setError(undefined);
    try {
      await projectApi.attachDriveFolder(project.id, value);
      setAttachFolderValue('');
      await load();
    } catch (linkError) {
      setError(errorMessage(linkError));
    } finally {
      setLinkingProjectId(undefined);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
      <form className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={saveProject}>
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-ink dark:text-white">{editingId ? 'Edit Project' : 'Add Project'}</h2><Flag className="text-action" size={22} /></div>
        <div className="mt-5 grid gap-4">
          <input className="rounded-md border border-line bg-white px-3 py-2 text-ink dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Project name" value={form.projectName} onChange={(event) => setForm({ ...form, projectName: event.target.value })} required />
          <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}><option value="">No customer linked</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select>
          <textarea className="min-h-20 rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>{projectStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
            <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>{priorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}</select>
          </div>
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Assigned to" value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} />
        </div>
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p> : null}
        <div className="mt-5 flex gap-2"><button className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit"><Plus size={17} />Save</button>{editingId ? <button className="rounded-md border border-line px-4 py-2 text-steel dark:border-slate-700 dark:text-slate-300" type="button" onClick={() => { setEditingId(undefined); setForm(emptyProject); }}>Cancel</button> : null}</div>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-xl font-semibold text-ink dark:text-white">Projects</h2><p className="text-sm text-steel dark:text-slate-400">Track project status, priority, assignments, milestones, and Drive folder links.</p></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
            <label className="flex items-center rounded-md border border-line px-3 dark:border-slate-700"><Search size={17} className="text-steel" /><input className="w-full bg-transparent px-2 py-2 text-sm outline-none" placeholder="Search projects" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus | 'all')}><option value="all">All status</option>{projectStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {projects.map((project) => (
            <article key={project.id} className="rounded-lg border border-line p-4 dark:border-slate-800">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div><h3 className="font-semibold text-ink dark:text-white">{project.projectName}</h3><p className="text-sm text-steel dark:text-slate-400">{customerName(project.customerId)} · {project.assignedTo || 'Unassigned'}</p><p className="mt-2 text-sm text-steel dark:text-slate-300">{project.description || 'No description'}</p></div>
                <div className="flex flex-wrap gap-2 lg:justify-end"><span className="rounded-md bg-field px-2 py-1 text-xs dark:bg-slate-800">{statusLabels[project.status]}</span><span className="rounded-md bg-field px-2 py-1 text-xs dark:bg-slate-800">{priorityLabels[project.priority]}</span>{project.dueDate ? <span className="inline-flex items-center gap-1 rounded-md bg-field px-2 py-1 text-xs dark:bg-slate-800"><CalendarDays size={13} />{project.dueDate}</span> : null}</div>
              </div>

              <div className="mt-4 rounded-md border border-dashed border-line p-3 text-sm dark:border-slate-700">
                {project.driveFolderId ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-ink dark:text-white">{project.driveFolderName || 'Google Drive folder linked'}</p>
                      <p className="text-steel dark:text-slate-400">Files uploaded to this project can sync into Drive.</p>
                    </div>
                    {project.driveFolderUrl ? <a className="inline-flex items-center gap-1 text-action" href={project.driveFolderUrl} rel="noreferrer" target="_blank"><ExternalLink size={14} />Open folder</a> : null}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-steel dark:text-slate-400">No Drive folder linked yet.</p>
                      <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" disabled={linkingProjectId === project.id} onClick={() => void createDriveFolder(project)}>
                        <FolderSync size={14} />
                        {linkingProjectId === project.id ? 'Linking...' : 'Create Drive folder'}
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input className="rounded-md border border-line bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Paste existing Drive folder URL or ID" value={attachFolderValue} onChange={(event) => setAttachFolderValue(event.target.value)} />
                      <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" disabled={linkingProjectId === project.id || !attachFolderValue.trim()} onClick={() => void attachDriveFolder(project)}>
                        <Link2 size={14} />
                        Attach existing
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">{project.milestones.length ? project.milestones.map((item) => <span key={item.id} className="rounded-md bg-field px-2 py-1 text-xs dark:bg-slate-800">{item.title}</span>) : <span className="text-sm text-steel dark:text-slate-400">No milestones</span>}</div>
                <div className="flex gap-2"><input className="w-44 rounded-md border border-line bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Milestone" value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} /><button className="rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" onClick={() => void addMilestone(project)}>Add</button><button className="rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" onClick={() => editProject(project)}>Edit</button><button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line dark:border-slate-700" type="button" onClick={() => void removeProject(project)} aria-label={`Delete ${project.projectName}`}><Trash2 size={15} /></button></div>
              </div>
            </article>
          ))}
          {!projects.length ? <p className="py-8 text-center text-sm text-steel dark:text-slate-400">No projects match the current filters.</p> : null}
        </div>
      </section>
    </div>
  );
}
