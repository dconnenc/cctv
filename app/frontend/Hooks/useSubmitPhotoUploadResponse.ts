import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';

export interface SubmitPhotoUploadResponseParams {
  blockId: string;
  photoSignedId: string;
  answer?: Record<string, unknown>;
}

export function useSubmitPhotoUploadResponse() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPhotoUploadResponse = useCallback(
    async ({ blockId, photoSignedId, answer = {} }: SubmitPhotoUploadResponseParams) => {
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
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/submit_photo_upload_response`,
          {
            method: 'POST',
            body: JSON.stringify({
              photo_signed_id: photoSignedId,
              answer,
            }),
          },
        );

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Photo upload submission failed';
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
    [code, experienceFetch],
  );

  return {
    submitPhotoUploadResponse,
    isLoading,
    error,
    setError,
  };
}
