import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';

export interface SubmitCollaborativeDrawingPhotoParams {
  blockId: string;
  photoSignedId: string;
}

export function useSubmitCollaborativeDrawingPhoto() {
  const { code, experienceFetch } = useExperience();
  const { setSubmissionState } = useExperienceState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPhoto = useCallback(
    async ({ blockId, photoSignedId }: SubmitCollaborativeDrawingPhotoParams) => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/collaborative_drawing/photos`,
          {
            method: 'POST',
            body: JSON.stringify({ photo_signed_id: photoSignedId }),
          },
        );

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Photo submission failed';
          setError(msg);
          return { success: false, error: msg };
        }

        if (data.submission) {
          setSubmissionState((prev) => ({
            ...prev,
            [blockId]: {
              ...prev[blockId],
              id: data.submission.id,
              answer: data.submission.answer,
              photo_url: data.submission.photo_url,
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

  return { submitPhoto, isLoading, error, setError };
}
