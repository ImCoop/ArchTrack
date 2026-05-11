import { Navigate, Outlet, useLocation } from 'react-router-dom';

import type { Role } from '../../types/auth';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-field px-4 text-sm text-steel">
        Loading ArchTrack...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
