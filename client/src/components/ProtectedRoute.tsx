import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="pixel-text text-sm text-ink-muted">LOADING…</div>
      </div>
    );
  }

  if (!user) {
    // Preserve the target path so the login page can redirect back after auth.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
