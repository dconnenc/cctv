import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { ApiPayload, BlockKind, BlockStatus, CreateExperienceApiResponse } from '@cctv/types';
import { qaLogger } from '@cctv/utils';

export interface CreateBlockVariable {
  key: string;
  label: string;
  datatype: string;
  required: boolean;
  source?:
    | { type: string; participant_id: string }
    | { kind: string; question: string; input_type: string };
}

export interface CreateBlockQuestion {
  payload: Record<string, string | number | boolean>;
}

export interface CreateExperienceBlockParams {
  kind: BlockKind;
  payload?: ApiPayload;
  visible_to_segment_ids?: string[];
  status?: BlockStatus;
  open_immediately?: boolean;
  add_to_playbill?: boolean;
  playbill_mysterious?: boolean;
  variables?: CreateBlockVariable[];
  questions?: CreateBlockQuestion[];
}

interface CreateBlockRequestBody {
  kind: BlockKind;
  payload?: ApiPayload;
  visible_to_segment_ids: string[];
  status: BlockStatus;
  open_immediately: boolean;
  add_to_playbill: boolean;
  playbill_mysterious: boolean;
  variables?: CreateBlockVariable[];
  questions?: CreateBlockQuestion[];
}

export function useCreateExperienceBlock() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExperienceBlock = useCallback(
    async ({
      kind,
      payload,
      visible_to_segment_ids = [],
      status = 'hidden',
      open_immediately = false,
      add_to_playbill = false,
      playbill_mysterious = false,
      variables,
      questions,
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

      const submitPayload: CreateBlockRequestBody = {
        kind,
        payload,
        visible_to_segment_ids,
        status,
        open_immediately,
        add_to_playbill,
        playbill_mysterious,
        ...(variables && { variables }),
        ...(questions && questions.length > 0 && { questions }),
      };

      try {
        const res = await adminFetch(`/api/experiences/${encodeURIComponent(code)}/blocks`, {
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
    [code, adminFetch],
  );

  return {
    createExperienceBlock,
    isLoading,
    error,
    setError,
  };
}
