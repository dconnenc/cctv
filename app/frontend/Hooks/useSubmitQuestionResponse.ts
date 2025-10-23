import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { qaLogger } from '@cctv/utils';

export interface SubmitQuestionResponseParams {
  blockId: string;
  answer: {
    value: string;
    submittedAt: string;
  };
}

export interface SubmitQuestionResponseResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export function useSubmitQuestionResponse() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuestionResponse = useCallback(
    async ({
      blockId,
      answer,
    }: SubmitQuestionResponseParams): Promise<SubmitQuestionResponseResponse | null> => {
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

      qaLogger(`Submitting question response for block ${blockId} in experience ${code}`);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/submit_question_response`,
          {
            method: 'POST',
            body: JSON.stringify({ answer }),
          },
        );

        const data: SubmitQuestionResponseResponse = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Question submission failed';
          setError(msg);
          return { success: false, error: msg };
        }

        qaLogger('Successfully submitted question response');
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
    submitQuestionResponse,
    isLoading,
    error,
    setError,
  };
}
