import { useLocation, useParams } from 'react-router-dom';

/** Reads the experience code from URL params and derives the current page type from the pathname. */
export function useExperienceRoute() {
  const { code } = useParams<{ code: string }>();
  const { pathname } = useLocation();
  return {
    code: code ?? '',
    isManagePage: pathname.includes('/manage') || pathname.includes('/timeline'),
    isMonitorPage: pathname.includes('/monitor'),
  };
}
