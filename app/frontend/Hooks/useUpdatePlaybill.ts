import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts';
import { PlaybillSection } from '@cctv/types';

export function useUpdatePlaybill() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePlaybill = useCallback(
    async (playbill: PlaybillSection[]) => {
      if (!code) {
        setError('Missing experience code');
        return { success: false, error: 'Missing experience code' } as const;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/update_playbill`,
          {
            method: 'PATCH',
            body: JSON.stringify({ playbill }),
          },
        );
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || 'Failed to update playbill';
          setError(msg);
          return { success: false, error: msg } as const;
        }
        return { success: true } as const;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Connection error';
        setError(msg);
        return { success: false, error: msg } as const;
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  return { updatePlaybill, isLoading, error };
}
