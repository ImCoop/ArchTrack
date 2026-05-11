import { Bell, BriefcaseBusiness, Calculator, Clock, FileArchive, FileText, LayoutDashboard, LogOut, Moon, ReceiptText, Shield, Sun, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';

import type { Role } from '../types/auth';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import { notificationApi } from '../features/notifications/notification-api';

interface NavigationItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  allowedRoles?: Role[];
}

const navigation: NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'CRM', to: '/crm', icon: BriefcaseBusiness },
  { label: 'Projects', to: '/projects', icon: FileText },
  { label: 'Tasks', to: '/tasks', icon: Users },
  { label: 'Files', to: '/files', icon: FileArchive },
  { label: 'Time', to: '/time', icon: Clock },
  { label: 'Quotes', to: '/quotes', icon: Calculator },
  { label: 'Invoices', to: '/invoices', icon: ReceiptText },
  { label: 'Users', to: '/users', icon: Shield, allowedRoles: ['admin'] },
];

const canAccess = (userRole: Role | undefined, item: NavigationItem) =>
  !item.allowedRoles || Boolean(userRole && item.allowedRoles.includes(userRole));

export function AppLayout() {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const visibleNavigation = navigation.filter((item) => canAccess(user?.role, item));
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email;

  const loadUnreadCount = useCallback(async () => {
    const unread = await notificationApi.list({ readStatus: 'unread' });
    setUnreadCount(unread.length);
  }, []);

  useEffect(() => {
    void loadUnreadCount();
  }, [loadUnreadCount]);

  return (
    <div className="min-h-screen bg-field text-ink dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="border-b border-line px-6 py-5 dark:border-slate-800">
          <p className="text-sm font-semibold uppercase tracking-wide text-action">ArchTrack</p>
          <h1 className="mt-1 text-xl font-semibold dark:text-white">Operations</h1>
        </div>
        <nav className="space-y-1 p-4">
          {visibleNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-action text-white' : 'text-steel hover:bg-field hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`
              }
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-steel dark:text-slate-400">ArchTrack</p>
              <h2 className="text-2xl font-semibold text-ink dark:text-white">Workspace</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-ink dark:text-white">{displayName}</p>
                <p className="text-xs capitalize text-steel dark:text-slate-400">{user?.role.replace('_', ' ')}</p>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-steel hover:bg-field dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
                onClick={toggleTheme}
                type="button"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <NavLink className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-steel hover:bg-field dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Notifications" to="/notifications">
                <Bell size={18} />
                {unreadCount ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-action px-1 text-center text-xs font-semibold text-white">{unreadCount}</span> : null}
              </NavLink>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-steel hover:bg-field dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Sign out"
                onClick={() => void logout()}
                type="button"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {visibleNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                `inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                    isActive ? 'bg-action text-white' : 'bg-white text-steel dark:bg-slate-800 dark:text-slate-300'
                  }`
                }
              >
                <item.icon size={16} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
