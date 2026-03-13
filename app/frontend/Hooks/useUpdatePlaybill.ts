import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts';
import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { PlaybillSection } from '@cctv/types';

export function useUpdatePlaybill() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePlaybill = useCallback(
    async (playbill: PlaybillSection[], playbill_enabled?: boolean) => {
      if (!code) {
        setError('Missing experience code');
        return { success: false, error: 'Missing experience code' } as const;
      }
      setIsLoading(true);
      setError(null);
      try {
        const body: Record<string, unknown> = { playbill };
        if (playbill_enabled !== undefined) body.playbill_enabled = playbill_enabled;
        const res = await adminFetch(
          `/api/experiences/${encodeURIComponent(code)}/update_playbill`,
          {
            method: 'PATCH',
            body: JSON.stringify(body),
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
    [code, adminFetch],
  );

  return { updatePlaybill, isLoading, error };
}
