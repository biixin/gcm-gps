import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, session } = useAuth();

  if (!isAuthenticated || session?.user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
