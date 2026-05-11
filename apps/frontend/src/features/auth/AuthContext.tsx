import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiClient } from '../../api/client';
import type { AuthResponse, Role, User } from '../../types/auth';
import { authStorage } from './auth-storage';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  accessToken?: string;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<void>;
  loginWithGoogleCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  user?: User;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | undefined>(() => authStorage.getAccessToken() ?? undefined);
  const [user, setUser] = useState<User | undefined>();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const applyAuth = useCallback((response: AuthResponse) => {
    setAccessToken(response.accessToken);
    setUser(response.user);
    authStorage.setAccessToken(response.accessToken);
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(undefined);
    setUser(undefined);
    authStorage.clearAccessToken();
  }, []);

  useEffect(() => {
    const interceptor = apiClient.interceptors.request.use((config) => {
      const token = authStorage.getAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    return () => {
      apiClient.interceptors.request.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      const storedToken = authStorage.getAccessToken();

      if (!storedToken) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const { data } = await apiClient.get<{ user: User }>('/auth/me');

        if (isMounted) {
          setUser(data.user);
          setAccessToken(storedToken);
        }
      } catch {
        clearAuth();
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [clearAuth]);

  const login = useCallback(
    async (input: LoginInput) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
      applyAuth(data);
    },
    [applyAuth],
  );

  const loginWithGoogleCode = useCallback(
    async (code: string) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/google/callback', { code });
      applyAuth(data);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
      applyAuth(data);
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isBootstrapping,
      login,
      loginWithGoogleCode,
      logout,
      register,
      user,
    }),
    [accessToken, isBootstrapping, login, loginWithGoogleCode, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
