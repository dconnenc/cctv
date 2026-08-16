import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

import { registerRoute } from './client';
import { routePattern } from './routes';

/**
 * Keeps the `route` super property in step with the current SPA location so every
 * event — autocaptured pageviews included — can be grouped by page rather than by
 * the raw URL, which embeds experience codes and block ids. Renders nothing.
 */
export function RouteAnalytics() {
  const { pathname } = useLocation();

  useEffect(() => {
    registerRoute(routePattern(pathname));
  }, [pathname]);

  return null;
}
