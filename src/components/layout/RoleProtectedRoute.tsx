import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, Role } from '../../store/authStore';

interface RoleProtectedRouteProps {
  allowedRole: Role;
}

export default function RoleProtectedRoute({ allowedRole }: RoleProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={`/${allowedRole}/login`} replace />;
  }

  if (user.role !== allowedRole) {
    // If authenticated but wrong role, send to their respective dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Outlet />;
}
