import { Navigate } from 'react-router-dom';
import { useAuth } from '../model/authContext';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
