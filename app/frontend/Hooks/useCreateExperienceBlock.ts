import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { qaLogger } from '@cctv/utils';

type BlockStatus = 'hidden' | 'open' | 'closed';

export interface CreateExperienceBlockParams {
  kind: string;
  payload?: Record<string, any>;
  visible_to_roles?: string[];
  visible_to_segments?: string[];
  target_user_ids?: string[];
  status?: BlockStatus; // defaults to "hidden"
  open_immediately?: boolean; // defaults to false
}

export interface CreateExperienceBlockResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export function useCreateExperienceBlock() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExperienceBlock = useCallback(
    async ({
      kind,
      payload = {},
      visible_to_roles = [],
      visible_to_segments = [],
      target_user_ids = [],
      status = 'hidden',
      open_immediately = false,
    }: CreateExperienceBlockParams): Promise<CreateExperienceBlockResponse | null> => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }

      if (!kind?.trim()) {
        setError('Please enter a block kind');
        return null;
      }

      setIsLoading(true);
      setError(null);

      qaLogger(
        `Creating experience block for ${code} with kind=${kind}, ` +
          `open_immediately=${open_immediately}, status=${status}`,
      );

      const submitPayload = {
        kind,
        payload,
        visible_to_roles,
        visible_to_segments,
        target_user_ids,
        status,
        open_immediately,
      };

      console.log('payload: ', submitPayload);
      try {
        const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}/blocks`, {
          method: 'POST',
          body: JSON.stringify({ experience: submitPayload }),
        });

        const data: CreateExperienceBlockResponse = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Block create failed';
          setError(msg);
          return { success: false, error: msg };
        }

        qaLogger('Successfully created block');
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
    createExperienceBlock,
    isLoading,
    error,
    setError,
  };
}
