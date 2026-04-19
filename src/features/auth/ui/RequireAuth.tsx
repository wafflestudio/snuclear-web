import { Navigate } from 'react-router-dom';
import { useAuth } from '../model/authContext';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
