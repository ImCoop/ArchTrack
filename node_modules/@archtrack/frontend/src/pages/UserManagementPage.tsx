import { AxiosError } from 'axios';
import { Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../features/auth/AuthContext';
import { type CreateUserInput, type UpdateUserInput, userApi } from '../features/users/user-api';
import { roles, type Role, type User } from '../types/auth';

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  designer: 'Designer',
  drafter: 'Drafter',
  estimator: 'Estimator',
  accounting: 'Accounting',
  viewer: 'Viewer',
};

const departmentOptions = ['Design', 'Drafting', 'Estimating', 'Accounting', 'Operations'];

const emptyForm: CreateUserInput = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'viewer',
  departmentId: 'Drafting',
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? 'Unable to update users.';
  }

  return 'Unable to update users.';
};

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [form, setForm] = useState<CreateUserInput>(emptyForm);
  const [editingId, setEditingId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const nextUsers = await userApi.list({
        search,
        role: roleFilter,
        departmentId: departmentFilter,
      });
      setUsers(nextUsers);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [departmentFilter, roleFilter, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUsers();
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      departments: new Set(users.map((user) => user.departmentId).filter(Boolean)).size,
    }),
    [users],
  );

  function resetForm() {
    setForm(emptyForm);
    setEditingId(undefined);
  }

  function editUser(user: User) {
    setEditingId(user.id);
    setForm({
      email: user.email,
      password: '',
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      role: user.role,
      departmentId: user.departmentId ?? 'Drafting',
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);

    try {
      if (editingId) {
        const update: UpdateUserInput = {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          departmentId: form.departmentId,
        };
        await userApi.update(editingId, update);
      } else {
        await userApi.create(form);
      }

      resetForm();
      await loadUsers();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteUser(user: User) {
    setError(undefined);

    try {
      await userApi.delete(user.id);
      await loadUsers();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-steel dark:text-slate-400">Visible users</p>
          <p className="mt-2 text-3xl font-semibold text-ink dark:text-white">{stats.total}</p>
        </article>
        <article className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-steel dark:text-slate-400">Admins</p>
          <p className="mt-2 text-3xl font-semibold text-ink dark:text-white">{stats.admins}</p>
        </article>
        <article className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-steel dark:text-slate-400">Departments</p>
          <p className="mt-2 text-3xl font-semibold text-ink dark:text-white">{stats.departments}</p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        <form className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-action">Admin</p>
              <h2 className="mt-1 text-xl font-semibold text-ink dark:text-white">{editingId ? 'Edit User' : 'Add User'}</h2>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-field text-action dark:bg-slate-800">
              <ShieldCheck size={19} />
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="text-sm font-medium text-ink dark:text-slate-200">
              First name
              <input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
            </label>
            <label className="text-sm font-medium text-ink dark:text-slate-200">
              Last name
              <input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
            </label>
            <label className="text-sm font-medium text-ink dark:text-slate-200">
              Email
              <input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </label>
            {!editingId ? (
              <label className="text-sm font-medium text-ink dark:text-slate-200">
                Temporary password
                <input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950" type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
              </label>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="text-sm font-medium text-ink dark:text-slate-200">
                Role
                <select className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-ink dark:text-slate-200">
                Department
                <select className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950" value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p> : null}

          <div className="mt-5 flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60" disabled={isSaving} type="submit">
              <Plus size={17} />
              {isSaving ? 'Saving' : editingId ? 'Save' : 'Add'}
            </button>
            {editingId ? (
              <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-steel hover:bg-field dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={resetForm} type="button">
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-white">Users</h2>
              <p className="text-sm text-steel dark:text-slate-400">Search, filter, and maintain ArchTrack access.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_160px_160px]">
              <label className="flex items-center rounded-md border border-line px-3 dark:border-slate-700">
                <Search className="text-steel dark:text-slate-400" size={17} />
                <input className="w-full bg-transparent px-2 py-2 text-sm outline-none" placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <select className="rounded-md border border-line bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as Role | 'all')}>
                <option value="all">All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
              <select className="rounded-md border border-line bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="">All departments</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase text-steel dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 pr-3 font-semibold">Name</th>
                  <th className="px-3 py-3 font-semibold">Email</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                  <th className="px-3 py-3 font-semibold">Department</th>
                  <th className="py-3 pl-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-line last:border-b-0 dark:border-slate-800">
                    <td className="py-3 pr-3 font-medium text-ink dark:text-white">
                      {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                    </td>
                    <td className="px-3 py-3 text-steel dark:text-slate-300">{user.email}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-md bg-field px-2 py-1 text-xs font-medium text-steel dark:bg-slate-800 dark:text-slate-300">{roleLabels[user.role]}</span>
                    </td>
                    <td className="px-3 py-3 text-steel dark:text-slate-300">{user.departmentId ?? 'Unassigned'}</td>
                    <td className="py-3 pl-3">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-steel hover:bg-field dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => editUser(user)} type="button">
                          Edit
                        </button>
                        <button
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-steel hover:bg-field disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          disabled={currentUser?.id === user.id}
                          onClick={() => void deleteUser(user)}
                          type="button"
                          aria-label={`Delete ${user.email}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isLoading ? <p className="py-6 text-center text-sm text-steel dark:text-slate-400">Loading users...</p> : null}
            {!isLoading && users.length === 0 ? <p className="py-6 text-center text-sm text-steel dark:text-slate-400">No users match the current filters.</p> : null}
          </div>
        </section>
      </section>
    </div>
  );
}
