import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { TheScenePhase } from '@cctv/types';

interface ActionResult {
  success: boolean;
  error?: string;
}

export function useTheScene() {
  const { code, experienceFetch } = useExperience();
  const { adminFetch } = useAdminAuth();
  const { setSubmissionState } = useExperienceState();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buildAdminUrl = useCallback(
    (blockId: string, path: string) =>
      `/api/experiences/${encodeURIComponent(code ?? '')}/blocks/${encodeURIComponent(blockId)}/the_scene/${path}`,
    [code],
  );

  const buildParticipantUrl = useCallback(
    (blockId: string, path: string) =>
      `/api/experiences/${encodeURIComponent(code ?? '')}/blocks/${encodeURIComponent(blockId)}/the_scene/${path}`,
    [code],
  );

  const adminPost = useCallback(
    async (blockId: string, path: string, body?: object): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      try {
        const res = await adminFetch(buildAdminUrl(blockId, path), {
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
    [code, adminFetch, buildAdminUrl],
  );

  const advancePhase = useCallback(
    (blockId: string, phase: TheScenePhase) => adminPost(blockId, 'phase', { phase }),
    [adminPost],
  );

  const nextScene = useCallback((blockId: string) => adminPost(blockId, 'next'), [adminPost]);
  const clearTop = useCallback((blockId: string) => adminPost(blockId, 'clear_top'), [adminPost]);
  const clearAll = useCallback((blockId: string) => adminPost(blockId, 'clear_all'), [adminPost]);
  const clearSuggestion = useCallback(
    (blockId: string, suggestionId: string) =>
      adminPost(blockId, `clear/${encodeURIComponent(suggestionId)}`),
    [adminPost],
  );

  const submitSuggestion = useCallback(
    async (blockId: string, text: string): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await experienceFetch(buildParticipantUrl(blockId, 'suggestions'), {
          method: 'POST',
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          const msg = data?.error || 'Failed to submit suggestion';
          setError(msg);
          return { success: false, error: msg };
        }
        if (data.suggestion) {
          setSubmissionState((prev) => ({
            ...prev,
            [blockId]: {
              ...prev[blockId],
              own_suggestion: { id: data.suggestion.id, text: data.suggestion.text },
            },
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
        setIsSubmitting(false);
      }
    },
    [code, experienceFetch, buildParticipantUrl, setSubmissionState],
  );

  const submitVote = useCallback(
    async (blockId: string, suggestionId: string): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      try {
        const res = await experienceFetch(buildParticipantUrl(blockId, 'votes'), {
          method: 'POST',
          body: JSON.stringify({ suggestion_id: suggestionId }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          const msg = data?.error || 'Failed to submit vote';
          setError(msg);
          return { success: false, error: msg };
        }
        if (data.vote) {
          setSubmissionState((prev) => ({
            ...prev,
            [blockId]: { ...prev[blockId], own_vote_suggestion_id: data.vote.improv_suggestion_id },
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
      }
    },
    [code, experienceFetch, buildParticipantUrl, setSubmissionState],
  );

  return {
    advancePhase,
    nextScene,
    clearTop,
    clearAll,
    clearSuggestion,
    submitSuggestion,
    submitVote,
    isSubmitting,
    error,
  };
}
