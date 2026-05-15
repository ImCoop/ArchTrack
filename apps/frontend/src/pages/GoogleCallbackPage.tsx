import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import type { ApiErrorPayload } from '../types/auth';
import { useAuth } from '../features/auth/AuthContext';

const getErrorDetails = (error: unknown) => {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorPayload | undefined;

    return {
      code: payload?.code ?? 'REQUEST_FAILED',
      message: payload?.message ?? 'Google sign in could not be completed.',
      status: error.response?.status,
    };
  }

  return {
    code: 'CLIENT_ERROR',
    message: error instanceof Error ? error.message : 'Google sign in could not be completed.',
    status: undefined,
  };
};

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogleCode } = useAuth();
  const [message, setMessage] = useState('Completing Google sign in...');
  const [error, setError] = useState<{ code: string; message: string; status?: number }>();

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setMessage('Google did not return an authorization code.');
      setError({ code: 'GOOGLE_AUTH_CODE_MISSING', message: 'Google did not return an authorization code.' });
      return;
    }

    loginWithGoogleCode(code)
      .then(() => navigate('/', { replace: true }))
      .catch((loginError) => {
        const details = getErrorDetails(loginError);
        setMessage('Google sign in could not be completed.');
        setError(details);
      });
  }, [loginWithGoogleCode, navigate, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-field px-4 dark:bg-slate-950">
      <section className="rounded-lg border border-line bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-action">ArchTrack</p>
        <h1 className="mt-2 text-xl font-semibold text-ink dark:text-white">{message}</h1>
        {error ? <p className="mt-3 font-mono text-sm text-red-600 dark:text-red-300">Code: {error.code}{error.status ? ` | HTTP ${error.status}` : ''}</p> : null}
      </section>
    </main>
  );
}
