import { useMemo } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUser } from '@cctv/contexts/UserContext';
import { getStoredJWT } from '@cctv/utils';

/**
 * Allow: Admins OR participants with a valid experience JWT for :code.
 * If missing/expired JWT → send to /join?code=CODE
 */
const RequireExperienceParticipantOrAdmin = () => {
  const { user, isAdmin, isLoading } = useUser();
  const { code } = useExperience();

  const jwt = useMemo(() => (code ? getStoredJWT(code) : null), [code]);

  // Admins always allowed
  if (isLoading) return null;
  if (user && isAdmin) return <Outlet />;

  // Non-admin path: need a JWT
  if (!code) return <Navigate to="/" replace />;
  if (!jwt) return <Navigate to={`/join?code=${encodeURIComponent(code)}`} replace />;

  return <Outlet />;
};

export default RequireExperienceParticipantOrAdmin;
