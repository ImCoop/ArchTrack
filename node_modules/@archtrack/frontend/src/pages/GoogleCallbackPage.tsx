import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext';

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogleCode } = useAuth();
  const [message, setMessage] = useState('Completing Google sign in...');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setMessage('Google did not return an authorization code.');
      return;
    }

    loginWithGoogleCode(code)
      .then(() => navigate('/', { replace: true }))
      .catch(() => setMessage('Google sign in could not be completed.'));
  }, [loginWithGoogleCode, navigate, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-field px-4 dark:bg-slate-950">
      <section className="rounded-lg border border-line bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-action">ArchTrack</p>
        <h1 className="mt-2 text-xl font-semibold text-ink dark:text-white">{message}</h1>
      </section>
    </main>
  );
}
