import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { ApiResponse } from '@cctv/types';

export function useBlockSources(consumerBlockId: string) {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = code
    ? `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(consumerBlockId)}/sources`
    : null;

  const handleResponse = async (res: Response) => {
    const data: ApiResponse = await res.json();
    if (!data?.success) {
      const msg = data?.error || 'Source operation failed';
      setError(msg);
      throw new Error(msg);
    }
    setError(null);
    return data;
  };

  const attach = useCallback(
    async (sourceBlockId: string) => {
      if (!baseUrl) return null;
      setIsLoading(true);
      try {
        return await handleResponse(
          await adminFetch(baseUrl, {
            method: 'POST',
            body: JSON.stringify({ source_block_id: sourceBlockId }),
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl, adminFetch],
  );

  const detach = useCallback(
    async (sourceBlockId: string) => {
      if (!baseUrl) return null;
      setIsLoading(true);
      try {
        return await handleResponse(
          await adminFetch(`${baseUrl}/${encodeURIComponent(sourceBlockId)}`, {
            method: 'DELETE',
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl, adminFetch],
  );

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      if (!baseUrl) return null;
      setIsLoading(true);
      try {
        return await handleResponse(
          await adminFetch(baseUrl, {
            method: 'PATCH',
            body: JSON.stringify({ source_block_ids: orderedIds }),
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl, adminFetch],
  );

  return { attach, detach, reorder, isLoading, error };
}
