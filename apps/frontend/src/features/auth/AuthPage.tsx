import { AxiosError } from 'axios';
import { LockKeyhole, Mail, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { roles, type Role } from '../../types/auth';
import { apiClient } from '../../api/client';
import { useAuth } from './AuthContext';

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  designer: 'Designer',
  drafter: 'Drafter',
  estimator: 'Estimator',
  accounting: 'Accounting',
  viewer: 'Viewer',
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? 'Unable to complete sign in.';
  }

  return 'Unable to complete sign in.';
};

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { isAuthenticated, login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      if (mode === 'login') {
        await login({
          email: String(formData.get('email')),
          password: String(formData.get('password')),
        });
      } else {
        await register({
          email: String(formData.get('email')),
          password: String(formData.get('password')),
          firstName: String(formData.get('firstName')),
          lastName: String(formData.get('lastName')),
          role: String(formData.get('role')) as Role,
        });
      }

      navigate(from, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startGoogleLogin() {
    setError(undefined);

    try {
      const { data } = await apiClient.get<{ authUrl: string }>('/auth/google/url');
      window.location.assign(data.authUrl);
    } catch (googleError) {
      setError(getErrorMessage(googleError));
    }
  }

  const isRegister = mode === 'register';

  return (
    <main className="min-h-screen bg-field">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between bg-ink px-6 py-8 text-white sm:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">ArchTrack</p>
            <h1 className="mt-16 max-w-md text-4xl font-semibold leading-tight sm:text-5xl">
              Drafting operations, organized from sign in onward.
            </h1>
          </div>
          <div className="mt-12 grid gap-3 text-sm text-slate-200">
            <p>Project records, assignments, revisions, and approvals start here.</p>
            <p>Access is role-aware, so each team member lands in the right workspace.</p>
          </div>
        </section>

        <section className="flex items-center px-4 py-10 sm:px-10">
          <div className="w-full rounded-lg border border-line bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-steel dark:text-slate-400">{isRegister ? 'Create workspace access' : 'Welcome back'}</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink dark:text-white">
                  {isRegister ? 'Register for ArchTrack' : 'Sign in to ArchTrack'}
                </h2>
              </div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-field text-action dark:bg-slate-800">
                {isRegister ? <UserPlus size={20} /> : <LockKeyhole size={20} />}
              </div>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {isRegister ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-ink dark:text-slate-200">
                    First name
                    <input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950 dark:text-white" name="firstName" required />
                  </label>
                  <label className="text-sm font-medium text-ink dark:text-slate-200">
                    Last name
                    <input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950 dark:text-white" name="lastName" required />
                  </label>
                </div>
              ) : null}

              <label className="text-sm font-medium text-ink dark:text-slate-200">
                Email
                <div className="mt-1 flex items-center rounded-md border border-line bg-white px-3 focus-within:border-action dark:border-slate-700 dark:bg-slate-950">
                  <Mail className="text-steel dark:text-slate-400" size={18} />
                  <input className="w-full bg-transparent px-3 py-2 text-base text-ink outline-none dark:text-white" name="email" type="email" autoComplete="email" required />
                </div>
              </label>

              <label className="text-sm font-medium text-ink dark:text-slate-200">
                Password
                <input
                  className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  name="password"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={isRegister ? 8 : undefined}
                  required
                />
              </label>

              {isRegister ? (
                <label className="text-sm font-medium text-ink dark:text-slate-200">
                  Role
                  <select className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950 dark:text-white" name="role" defaultValue="viewer">
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p> : null}

              <button
                className="inline-flex w-full items-center justify-center rounded-md bg-action px-4 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Working...' : isRegister ? 'Create account' : 'Sign in'}
              </button>
              <button
                className="inline-flex w-full items-center justify-center rounded-md border border-line bg-white px-4 py-2.5 font-semibold text-ink hover:bg-field dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                onClick={() => void startGoogleLogin()}
                type="button"
              >
                Continue with Google
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-steel dark:text-slate-400">
              {isRegister ? 'Already have access?' : 'Need access?'}{' '}
              <Link className="font-semibold text-action hover:text-teal-800" to={isRegister ? '/login' : '/register'}>
                {isRegister ? 'Sign in' : 'Create an account'}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
