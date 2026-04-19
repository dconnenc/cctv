import { Navigate, Outlet } from 'react-router-dom';

import { useUser } from '@cctv/contexts';

const RequireAuth = () => {
  const { user, isLoading } = useUser();

  if (isLoading) return null;
  if (!user) return <Navigate to="/users/sign_in" replace />;

  return <Outlet />;
};

export default RequireAuth;
