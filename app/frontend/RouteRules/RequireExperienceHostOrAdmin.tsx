import { useMemo } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUser } from '@cctv/contexts/UserContext';
import { getStoredJWT } from '@cctv/utils';

/**
 * Allow: Host-only (composed after participant/admin guard).
 * - If JWT missing → join
 * - If participant but not host → go to main experience page
 */
const RequireExperienceHostOrAdmin = () => {
  const { user, isAdmin, isLoading: userLoading } = useUser();
  const { experience, participant, code, isLoading: expLoading } = useExperience();
  const jwt = useMemo(() => (code ? getStoredJWT(code) : null), [code]);

  // Wait until both contexts are loaded
  if (userLoading || expLoading) return null;

  if (user && isAdmin) return <Outlet />;

  // If not admin, they need to actually be in the experience
  if (!code || !jwt)
    return <Navigate to={`/join?code=${encodeURIComponent(code || '')}`} replace />;

  // Determine host via experience.hosts
  const isHost = !!experience?.hosts?.some(
    (h: { id?: string; email?: string; user_id?: string }) =>
      (participant?.user_id && h.user_id === participant.user_id) ||
      (participant?.email && h.email === participant.email),
  );

  // If not a host, redirect back the experience main page
  if (!isHost) return <Navigate to={`/experiences/${encodeURIComponent(code)}`} replace />;

  return <Outlet />;
};

export default RequireExperienceHostOrAdmin;
