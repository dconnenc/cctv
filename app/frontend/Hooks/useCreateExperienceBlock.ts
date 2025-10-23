import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import {
  BlockKind,
  BlockStatus,
  CreateBlockPayload,
  CreateExperienceApiResponse,
  ParticipantRole,
} from '@cctv/types';
import { qaLogger } from '@cctv/utils';

export interface CreateExperienceBlockParams {
  kind: BlockKind;
  payload?: Record<string, any>;
  visible_to_roles?: ParticipantRole[];
  visible_to_segments?: string[];
  target_user_ids?: string[];
  status?: BlockStatus;
  open_immediately?: boolean;
  variables?: Array<{
    key: string;
    label: string;
    datatype: 'string' | 'number' | 'text';
    required: boolean;
    source:
      | { type: 'participant'; participant_id: string }
      | { kind: 'question'; question: string; input_type: string };
  }>;
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
      variables,
    }: CreateExperienceBlockParams): Promise<CreateExperienceApiResponse | null> => {
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

      const submitPayload: CreateBlockPayload = {
        kind,
        payload: payload as any,
        visible_to_roles,
        visible_to_segments,
        target_user_ids,
        status,
        open_immediately,
        ...(variables && { variables }),
      };

      try {
        const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}/blocks`, {
          method: 'POST',
          body: JSON.stringify({ block: submitPayload }),
        });

        const data: CreateExperienceApiResponse = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Block create failed';
          setError(msg);
          return { type: 'error', success: false, error: msg, message: msg };
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
