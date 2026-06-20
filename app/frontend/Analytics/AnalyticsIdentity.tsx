import { useEffect, useRef } from 'react';

import { useUser } from '@cctv/contexts';

import { identifyUser, resetAnalytics } from './client';

/**
 * Ties the analytics distinct id to the logged-in User#id so frontend and
 * backend events stitch together. Resets identity on logout. Renders nothing.
 * Must be mounted within UserProvider.
 */
export function AnalyticsIdentity() {
  const { user } = useUser();
  const identifiedId = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      if (identifiedId.current === user.id) return;
      identifyUser(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
        is_admin: user.admin || user.super_admin,
      });
      identifiedId.current = user.id;
    } else if (identifiedId.current) {
      resetAnalytics();
      identifiedId.current = null;
    }
  }, [user]);

  return null;
}
