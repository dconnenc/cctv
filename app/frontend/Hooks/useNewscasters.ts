import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';

interface ActionResult {
  success: boolean;
  error?: string;
}

export function useNewscasters() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);

  const buildUrl = useCallback(
    (blockId: string, path: string) =>
      `/api/experiences/${encodeURIComponent(code ?? '')}/blocks/${encodeURIComponent(blockId)}/newscasters/${path}`,
    [code],
  );

  const adminRequest = useCallback(
    async (blockId: string, path: string, body?: object): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      try {
        const res = await adminFetch(buildUrl(blockId, path), {
          method: 'POST',
          ...(body !== undefined && { body: JSON.stringify(body) }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          const msg = data?.error || `Failed to ${path}`;
          setError(msg);
          return { success: false, error: msg };
        }
        return { success: true };
      } catch (e: unknown) {
        const msg =
          e instanceof Error && e.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return { success: false, error: msg };
      }
    },
    [code, adminFetch, buildUrl],
  );

  const selectVideo = useCallback(
    (blockId: string, submissionId: string | null) =>
      adminRequest(blockId, 'select_video', { submission_id: submissionId }),
    [adminRequest],
  );
  const setPlaying = useCallback(
    (blockId: string, playing: boolean) => adminRequest(blockId, 'playing', { playing }),
    [adminRequest],
  );
  const restart = useCallback(
    (blockId: string) => adminRequest(blockId, 'restart'),
    [adminRequest],
  );

  return { selectVideo, setPlaying, restart, error };
}
