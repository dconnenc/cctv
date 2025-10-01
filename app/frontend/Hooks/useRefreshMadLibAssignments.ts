import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts';
import { Block } from '@cctv/types';

export function useRefreshMadLibAssignments() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (block: Block): Promise<{ success: boolean; error?: string } | null> => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }

      if (block.kind !== 'mad_lib') {
        setError('Block is not a mad lib');
        return null;
      }

      setIsLoading(true);
      setError(null);

      const path = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(block.id)}/refresh_assignments`;

      try {
        const res = await experienceFetch(path, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        const data = await res.json();

        if (!res.ok || data?.success === false) {
          const msg = data?.error || 'Failed to refresh mad lib assignments';
          setError(msg);
          return { success: false, error: msg };
        }

        return { success: true };
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
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

  return { refresh, isLoading, error, setError };
}
