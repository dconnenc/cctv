import { useMemo } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { useExperience, useUser } from '@cctv/contexts';
import { getStoredJWT } from '@cctv/utils';

/**
 * Allow: Host-only (composed after participant/admin guard).
 * - If JWT missing → join
 * - If participant but not host → go to main experience page
 */
const RequireExperienceHostOrAdmin = () => {
  const { user, isAdmin, isLoading: userLoading } = useUser();
  const { experience, user: expUser, code, isLoading: expLoading } = useExperience();
  const jwt = useMemo(() => (code ? getStoredJWT(code) : null), [code]);

  // Wait until both contexts are loaded
  if (userLoading || expLoading) return null;

  if (user && isAdmin) return <Outlet />;

  // If not admin, they need to actually be in the experience
  if (!code || !jwt)
    return <Navigate to={`/join?code=${encodeURIComponent(code || '')}`} replace />;

  // Determine host via experience.hosts
  const isHost = !!experience?.hosts?.some(
    (h: { id?: string; email?: string }) =>
      (expUser?.id && h.id === expUser.id) || (expUser?.email && h.email === expUser.email),
  );

  // If not a host, redirect back the experience main page
  if (!isHost) return <Navigate to={`/experiences/${encodeURIComponent(code)}`} replace />;

  return <Outlet />;
};

export default RequireExperienceHostOrAdmin;
