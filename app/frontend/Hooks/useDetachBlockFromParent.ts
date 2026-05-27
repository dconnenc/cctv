import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';

export function useDetachBlockFromParent() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detach = useCallback(
    async (blockId: string): Promise<{ success: boolean; error?: string }> => {
      if (!code) {
        setError('Missing experience code');
        return { success: false, error: 'Missing experience code' };
      }
      setIsLoading(true);
      setError(null);

      try {
        const res = await adminFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/detach_from_parent`,
          { method: 'POST' },
        );
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || 'Failed to detach block';
          setError(msg);
          return { success: false, error: msg };
        }
        return { success: true };
      } catch (e: unknown) {
        const msg =
          e instanceof Error && e.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [code, adminFetch],
  );

  return { detach, isLoading, error };
}
