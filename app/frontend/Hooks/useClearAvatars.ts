import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts';

export function useClearAvatars() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearAvatars = useCallback(async () => {
    if (!code) {
      setError('Missing experience code');
      return { success: false, error: 'Missing experience code' } as const;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await experienceFetch(
        `/api/experiences/${encodeURIComponent(code)}/clear_avatars`,
        {
          method: 'POST',
        },
      );
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        const msg = data?.error || 'Failed to clear avatars';
        setError(msg);
        return { success: false, error: msg } as const;
      }
      return { success: true } as const;
    } catch (e: any) {
      const msg = e?.message || 'Connection error';
      setError(msg);
      return { success: false, error: msg } as const;
    } finally {
      setIsLoading(false);
    }
  }, [code, experienceFetch]);

  return { clearAvatars, isLoading, error };
}
