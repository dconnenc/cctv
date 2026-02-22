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

export interface SubmitQuestionResponseResult {
  success: boolean;
  error?: string;
}

export function useSubmitQuestionResponse() {
  const { code, experienceFetch } = useExperience();
  const [error, setError] = useState<string | null>(null);

  const submitQuestionResponse = useCallback(
    async ({
      blockId,
      answer,
    }: SubmitQuestionResponseParams): Promise<SubmitQuestionResponseResult> => {
      if (!code) {
        setError('Missing experience code');
        return { success: false, error: 'Missing experience code' };
      }

      if (!blockId) {
        setError('Missing block ID');
        return { success: false, error: 'Missing block ID' };
      }

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

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Question submission failed';
          setError(msg);
          return { success: false, error: msg };
        }

        qaLogger('Successfully submitted question response');
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

  return { submitQuestionResponse, error, setError };
}
