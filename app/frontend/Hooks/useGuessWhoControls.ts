import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';

type Action = 'next' | 'previous' | 'reveal';

export function useGuessWhoControls() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useCallback(
    async (
      blockId: string,
      action: Action,
    ): Promise<{ success: boolean; error?: string } | null> => {
      if (!code || !blockId) return null;

      setIsLoading(true);
      setError(null);

      const url = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/guess_who/${action}`;

      try {
        const res = await adminFetch(url, { method: 'POST' });
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || `Failed to ${action} guess who`;
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

  return {
    nextSlide: (blockId: string) => dispatch(blockId, 'next'),
    previousSlide: (blockId: string) => dispatch(blockId, 'previous'),
    reveal: (blockId: string) => dispatch(blockId, 'reveal'),
    isLoading,
    error,
  };
}
