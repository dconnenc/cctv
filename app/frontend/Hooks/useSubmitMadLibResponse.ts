import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { qaLogger } from '@cctv/utils';

export interface SubmitMadLibResponseParams {
  blockId: string;
  answer: {
    variable_id: string;
    value: string;
  };
}

export interface SubmitMadLibResponseResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export function useSubmitMadLibResponse() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitMadLibResponse = useCallback(
    async ({
      blockId,
      answer,
    }: SubmitMadLibResponseParams): Promise<SubmitMadLibResponseResponse | null> => {
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

      qaLogger(`Submitting mad lib response for block ${blockId} in experience ${code}`);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/submit_mad_lib_response`,
          {
            method: 'POST',
            body: JSON.stringify({ answer }),
          },
        );

        const data: SubmitMadLibResponseResponse = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Mad lib submission failed';
          setError(msg);
          return { success: false, error: msg };
        }

        qaLogger('Successfully submitted mad lib response');
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
    submitMadLibResponse,
    isLoading,
    error,
    setError,
  };
}
