import { Navigate, Outlet } from 'react-router-dom';

import { useUser } from '@cctv/contexts/UserContext';

/**
 * Allow: Application Admins
 * If non-admin: redirect to sign_in route
 */
const RequireAdmin = () => {
  const { user, isAdmin, isLoading } = useUser();

  if (isLoading) return null;
  if (!user || !isAdmin) return <Navigate to="/users/sign_in" replace />;

  return <Outlet />;
};

export default RequireAdmin;
