import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { qaLogger } from '@cctv/utils';

export interface SubmitPollResponseParams {
  blockId: string;
  answer: {
    selectedOptions: string[];
    submittedAt: string;
  };
}

export interface SubmitPollResponseResult {
  success: boolean;
  error?: string;
}

export function useSubmitPollResponse() {
  const { code, experienceFetch } = useExperience();
  const [error, setError] = useState<string | null>(null);

  const submitPollResponse = useCallback(
    async ({ blockId, answer }: SubmitPollResponseParams): Promise<SubmitPollResponseResult> => {
      if (!code) {
        setError('Missing experience code');
        return { success: false, error: 'Missing experience code' };
      }

      if (!blockId) {
        setError('Missing block ID');
        return { success: false, error: 'Missing block ID' };
      }

      setError(null);

      qaLogger(`Submitting poll response for block ${blockId} in experience ${code}`);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/submit_poll_response`,
          {
            method: 'POST',
            body: JSON.stringify({ answer }),
          },
        );

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Poll submission failed';
          setError(msg);
          return { success: false, error: msg };
        }

        qaLogger('Successfully submitted poll response');
        return { success: true };
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return { success: false, error: msg };
      }
    },
    [code, experienceFetch],
  );

  return { submitPollResponse, error, setError };
}
