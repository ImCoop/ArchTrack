import { Route, Routes } from 'react-router-dom';

import { AuthPage } from './features/auth/AuthPage';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { ThemeProvider } from './features/theme/ThemeContext';
import { AppLayout } from './layouts/AppLayout';
import { CrmPage } from './pages/CrmPage';
import { Dashboard } from './pages/Dashboard';
import { FilesPage } from './pages/FilesPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { GoogleCallbackPage } from './pages/GoogleCallbackPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { QuotesPage } from './pages/QuotesPage';
import { TasksPage } from './pages/TasksPage';
import { TimeTrackingPage } from './pages/TimeTrackingPage';
import { UserManagementPage } from './pages/UserManagementPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/oauth/google/callback" element={<GoogleCallbackPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/crm" element={<CrmPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/time" element={<TimeTrackingPage />} />
              <Route path="/quotes" element={<QuotesPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
