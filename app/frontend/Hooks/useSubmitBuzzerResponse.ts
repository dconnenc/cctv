import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';

export function useSubmitBuzzerResponse() {
  const { code, experienceFetch } = useExperience();
  const { setSubmissionState } = useExperienceState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitBuzzerResponse = useCallback(
    async (blockId: string): Promise<{ success: boolean; error?: string } | null> => {
      if (!code || !blockId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/submit_buzzer_response`,
          {
            method: 'POST',
            body: JSON.stringify({ answer: { buzzed_at: new Date().toISOString() } }),
          },
        );

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Buzzer submission failed';
          setError(msg);
          return { success: false, error: msg };
        }

        if (data.submission) {
          setSubmissionState((prev) => ({
            ...prev,
            [blockId]: { id: data.submission.id, answer: data.submission.answer },
          }));
        }

        return { success: true };
      } catch (e: unknown) {
        const msg =
          e instanceof Error && e.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch, setSubmissionState],
  );

  return { submitBuzzerResponse, isLoading, error };
}
