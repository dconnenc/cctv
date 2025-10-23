import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { qaLogger } from '@cctv/utils';

export function useExperienceResume() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumeExperience = useCallback(async () => {
    if (!code) {
      setError('Missing experience code');
      return null;
    }

    setIsLoading(true);
    setError(null);

    qaLogger(`Resuming experience: ${code}`);

    try {
      const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}/resume`, {
        method: 'POST',
        body: JSON.stringify({ experience: { code: code } }),
      });

      const data = await res.json();

      if (!data?.success) {
        const msg = data?.error || 'Failed to resume experience';
        setError(msg);
        return { success: false, error: msg };
      }

      qaLogger('Successfully resumed experience');
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
  }, [code, experienceFetch]);

  return {
    resumeExperience,
    isLoading,
    error,
    setError,
  };
}
