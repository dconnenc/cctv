import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';

export function useKickParticipant() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kickParticipant = useCallback(
    async (participantId: string) => {
      if (!code) {
        setError('Missing experience code');
        return { success: false, error: 'Missing experience code' } as const;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await adminFetch(
          `/api/experiences/${encodeURIComponent(code)}/participants/${encodeURIComponent(participantId)}/kick`,
          { method: 'DELETE' },
        );
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || 'Failed to kick participant';
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
    },
    [code, adminFetch],
  );

  return { kickParticipant, isLoading, error };
}
