import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';

export interface SubmitNewscastersSourceResponseParams {
  blockId: string;
  videoSignedId?: string;
  videoUrl?: string;
}

export function useSubmitNewscastersSourceResponse() {
  const { code, experienceFetch } = useExperience();
  const { setSubmissionState } = useExperienceState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitNewscastersSourceResponse = useCallback(
    async ({ blockId, videoSignedId, videoUrl }: SubmitNewscastersSourceResponseParams) => {
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

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/newscasters/source/response`,
          {
            method: 'POST',
            body: JSON.stringify({
              ...(videoSignedId && { video_signed_id: videoSignedId }),
              ...(videoUrl && { video_url: videoUrl }),
            }),
          },
        );

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Video submission failed';
          setError(msg);
          return { success: false, error: msg };
        }

        if (data.submission) {
          setSubmissionState((prev) => ({
            ...prev,
            [blockId]: {
              id: data.submission.id,
              answer: data.submission.answer,
              video_url: data.submission.video_url,
            },
          }));
        }

        return data;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Connection error. Please try again.';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch, setSubmissionState],
  );

  return {
    submitNewscastersSourceResponse,
    isLoading,
    error,
    setError,
  };
}
