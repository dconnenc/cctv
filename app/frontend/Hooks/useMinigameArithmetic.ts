import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';

interface ActionResult {
  success: boolean;
  error?: string;
}

export function useMinigameArithmetic() {
  const { code, experienceFetch } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);

  const buildAdminUrl = useCallback(
    (blockId: string, action: 'start' | 'end' | 'restart') =>
      `/api/experiences/${encodeURIComponent(code ?? '')}/blocks/${encodeURIComponent(blockId)}/minigame/arithmetic/${action}`,
    [code],
  );

  const buildResponseUrl = useCallback(
    (blockId: string) =>
      `/api/experiences/${encodeURIComponent(code ?? '')}/blocks/${encodeURIComponent(blockId)}/minigame/arithmetic/responses`,
    [code],
  );

  const start = useCallback(
    async (blockId: string): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      const res = await adminFetch(buildAdminUrl(blockId, 'start'), { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const msg = data?.error || 'Failed to start minigame';
        setError(msg);
        return { success: false, error: msg };
      }
      return { success: true };
    },
    [code, adminFetch, buildAdminUrl],
  );

  const end = useCallback(
    async (blockId: string): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      const res = await adminFetch(buildAdminUrl(blockId, 'end'), { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const msg = data?.error || 'Failed to end minigame';
        setError(msg);
        return { success: false, error: msg };
      }
      return { success: true };
    },
    [code, adminFetch, buildAdminUrl],
  );

  const restart = useCallback(
    async (blockId: string): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      const res = await adminFetch(buildAdminUrl(blockId, 'restart'), { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const msg = data?.error || 'Failed to restart minigame';
        setError(msg);
        return { success: false, error: msg };
      }
      return { success: true };
    },
    [code, adminFetch, buildAdminUrl],
  );

  // Fire-and-forget: the round runs entirely client-side, so answers are
  // recorded best-effort for the leaderboard. We never await or surface errors
  // here — a slow or closed-block response must not block or interrupt play.
  const recordAnswer = useCallback(
    (blockId: string, questionIndex: number, answer: string): void => {
      if (!code) return;
      void experienceFetch(buildResponseUrl(blockId), {
        method: 'POST',
        body: JSON.stringify({ question_index: questionIndex, answer }),
      }).catch(() => {
        // Best-effort; the player's local game continues regardless.
      });
    },
    [code, experienceFetch, buildResponseUrl],
  );

  return { start, end, restart, recordAnswer, error };
}
