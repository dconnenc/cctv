import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Block, BlockStatus } from '@cctv/types';

export function useChangeBlockStatus() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = useCallback(
    async (
      block: Block,
      status: BlockStatus,
    ): Promise<{ success: boolean; error?: string } | null> => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }
      setIsLoading(true);
      setError(null);

      const baseUrl = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(block.id)}/`;

      try {
        let path = '';
        const method = 'POST';
        let body: any = undefined;

        if (status === 'open') {
          path = `${baseUrl}open`;
        } else if (status === 'closed') {
          path = `${baseUrl}close`;
        } else if (status === 'hidden') {
          path = `${baseUrl}hide`;
        }

        const res = await experienceFetch(path, { method, body });
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || `Failed to set status to ${status}`;
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

  return { change, isLoading, error, setError };
}
