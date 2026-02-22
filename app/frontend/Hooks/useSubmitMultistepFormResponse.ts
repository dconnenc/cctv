import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { qaLogger } from '@cctv/utils';

export interface SubmitMultistepFormResponseParams {
  blockId: string;
  answer: {
    responses: Record<string, string>;
    submittedAt: string;
  };
}

export interface SubmitMultistepFormResponseResult {
  success: boolean;
  error?: string;
}

export function useSubmitMultistepFormResponse() {
  const { code, experienceFetch } = useExperience();
  const [error, setError] = useState<string | null>(null);

  const submitMultistepFormResponse = useCallback(
    async ({
      blockId,
      answer,
    }: SubmitMultistepFormResponseParams): Promise<SubmitMultistepFormResponseResult> => {
      if (!code) {
        setError('Missing experience code');
        return { success: false, error: 'Missing experience code' };
      }

      if (!blockId) {
        setError('Missing block ID');
        return { success: false, error: 'Missing block ID' };
      }

      setError(null);

      qaLogger(`Submitting multistep form response for block ${blockId} in experience ${code}`);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/submit_multistep_form_response`,
          {
            method: 'POST',
            body: JSON.stringify({ answer }),
          },
        );

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Multistep form submission failed';
          setError(msg);
          return { success: false, error: msg };
        }

        qaLogger('Successfully submitted multistep form response');
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

  return { submitMultistepFormResponse, error, setError };
}
