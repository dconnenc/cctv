import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useMemo } from 'react';
import { Outlet, useNavigate } from "react-router-dom"

const getJWTKey = (code: string) => `experience_jwt_${code}`;
const getStoredJWT = (code: string) => localStorage.getItem(getJWTKey(code));

/**
 * Allow: anyone
 * - If already have JWT for :code → go straight to /experiences/:code
 */
const AllowRegisterRoute = () => {
  const { code } = useExperience();
  const jwt = useMemo(() => (code ? getStoredJWT(code) : null), [code]);

  if (jwt) return <Navigate to={`/experiences/${encodeURIComponent(code)}`} replace />;
  return <Outlet />;
};

export default AllowRegisterRoute
