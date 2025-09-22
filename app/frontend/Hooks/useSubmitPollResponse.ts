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

export interface SubmitPollResponseResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export function useSubmitPollResponse() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPollResponse = useCallback(
    async ({
      blockId,
      answer
    }: SubmitPollResponseParams): Promise<SubmitPollResponseResponse | null> => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }

      if (!blockId) {
        setError('Missing block ID');
        return null;
      }

      setIsLoading(true);
      setError(null);

      qaLogger(
        `Submitting poll response for block ${blockId} in experience ${code}`
      );

      try {
        const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/submit_poll_response`, {
          method: 'POST',
          body: JSON.stringify({ answer }),
        });

        const data: SubmitPollResponseResponse = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Poll submission failed';
          setError(msg);
          return { success: false, error: msg };
        }

        qaLogger('Successfully submitted poll response');
        return data;
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

  return {
    submitPollResponse,
    isLoading,
    error,
    setError,
  };
}
