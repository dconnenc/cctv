import { useMemo } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { getStoredParticipantJWT } from '@cctv/contexts/jwtStorage';

/**
 * Allow: anyone
 * - If already have JWT for :code → go straight to /experiences/:code
 */
const AllowRegisterRoute = () => {
  const { code } = useExperience();
  const jwt = useMemo(() => (code ? getStoredParticipantJWT(code) : null), [code]);

  if (jwt) return <Navigate to={`/experiences/${encodeURIComponent(code)}`} replace />;
  return <Outlet />;
};

export default AllowRegisterRoute;
