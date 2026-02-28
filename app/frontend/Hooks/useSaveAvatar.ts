import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { AvatarStroke } from '@cctv/types';

export interface SaveAvatarParams {
  participantId: string;
  strokes?: AvatarStroke[];
}

export function useSaveAvatar() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAvatar = useCallback(
    async ({ participantId, strokes }: SaveAvatarParams) => {
      if (!code) {
        setError('Missing experience code');
        return { success: false, error: 'Missing experience code' } as const;
      }
      if (!participantId) {
        setError('Missing participant');
        return { success: false, error: 'Missing participant' } as const;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/participants/${encodeURIComponent(participantId)}/avatar`,
          {
            method: 'POST',
            body: JSON.stringify({ avatar: { strokes } }),
          },
        );
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || 'Failed to save avatar';
          setError(msg);
          return { success: false, error: msg } as const;
        }
        return { success: true } as const;
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return { success: false, error: msg } as const;
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  return { saveAvatar, isLoading, error, setError };
}
