import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { ApiResponse, UpdateBlockPayload } from '@cctv/types';

export function useUpdateExperienceBlock() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateExperienceBlock = useCallback(
    async (blockId: string, payload: UpdateBlockPayload): Promise<ApiResponse | null> => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await adminFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ block: payload }),
          },
        );

        const data: ApiResponse = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Block update failed';
          setError(msg);
          return { success: false, error: msg, message: msg };
        }

        return data;
      } catch (e: unknown) {
        const msg =
          (e as Error)?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [code, adminFetch],
  );

  return {
    updateExperienceBlock,
    isLoading,
    error,
    setError,
  };
}
