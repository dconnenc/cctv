import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';

export interface SubmitCollaborativeDrawingParams {
  blockId: string;
  image: string;
  // Autosaves (finalize: false) persist the canvas without flipping the drawer
  // to the submitted view or broadcasting; defaults to a final submit.
  finalize?: boolean;
}

export function useSubmitCollaborativeDrawing() {
  const { code, experienceFetch } = useExperience();
  const { setSubmissionState } = useExperienceState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDrawing = useCallback(
    async ({ blockId, image, finalize = true }: SubmitCollaborativeDrawingParams) => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }

      setIsLoading(true);
      setError(null);

      // A final submit optimistically advances the UI even if the round already
      // closed server-side (best-effort dispatch); autosaves keep the drawer on
      // the canvas.
      if (finalize) {
        setSubmissionState((prev) => ({
          ...prev,
          [blockId]: { ...prev[blockId], image, submitted: true },
        }));
      }

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/collaborative_drawing/drawings`,
          {
            method: 'POST',
            body: JSON.stringify({ image, finalize }),
          },
        );

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Drawing submission failed';
          setError(msg);
          return { success: false, error: msg };
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

  return { submitDrawing, isLoading, error };
}
