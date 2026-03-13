import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';

export function useClearBuzzerResponses() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearBuzzerResponses = useCallback(
    async (blockId: string): Promise<{ success: boolean; error?: string } | null> => {
      if (!code || !blockId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/clear_buzzer_responses`,
          { method: 'DELETE' },
        );

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Failed to clear buzzer responses';
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
    [code, experienceFetch],
  );

  return { clearBuzzerResponses, isLoading, error };
}
