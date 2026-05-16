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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildAdminUrl = useCallback(
    (blockId: string, action: 'start' | 'end') =>
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

  const submitAnswer = useCallback(
    async (blockId: string, questionIndex: number, answer: string): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await experienceFetch(buildResponseUrl(blockId), {
          method: 'POST',
          body: JSON.stringify({ question_index: questionIndex, answer }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          const msg = data?.error || 'Failed to submit answer';
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
      } finally {
        setIsSubmitting(false);
      }
    },
    [code, experienceFetch, buildResponseUrl],
  );

  return { start, end, submitAnswer, isSubmitting, error };
}
