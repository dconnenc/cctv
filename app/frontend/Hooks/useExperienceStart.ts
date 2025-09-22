import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { qaLogger } from '@cctv/utils';

type BlockStatus = 'hidden' | 'open' | 'closed';

export interface CreateExperienceBlockResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export function useExperienceStart() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startExperience = useCallback(
    async () => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }

      setIsLoading(true);
      setError(null);

      qaLogger(`Starting experience: ${code}`);

      try {
        const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}/start`, {
          method: 'POST',
          body: JSON.stringify({ experience: { code: code } }),
        });

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Failed to start experience';
          setError(msg);
          return { success: false, error: msg };
        }

        qaLogger('Successfully started experience');
        return data;
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  return {
    startExperience,
    isLoading,
    error,
    setError,
  };
}
