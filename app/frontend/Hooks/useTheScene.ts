import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';

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

  const buildUrl = useCallback(
    (blockId: string, path: string) =>
      `/api/experiences/${encodeURIComponent(code ?? '')}/blocks/${encodeURIComponent(blockId)}/the_scene/${path}`,
    [code],
  );

  const adminRequest = useCallback(
    async (
      method: 'POST' | 'PATCH',
      blockId: string,
      path: string,
      body?: object,
    ): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      try {
        const res = await adminFetch(buildUrl(blockId, path), {
          method,
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

  const startScene = useCallback(
    (blockId: string) => adminRequest('POST', blockId, 'start'),
    [adminRequest],
  );
  const endScene = useCallback(
    (blockId: string) => adminRequest('POST', blockId, 'end'),
    [adminRequest],
  );
  const forceNextScene = useCallback(
    (blockId: string) => adminRequest('POST', blockId, 'force_next_scene'),
    [adminRequest],
  );
  const updatePerformers = useCallback(
    (blockId: string, performerParticipantIds: string[]) =>
      adminRequest('PATCH', blockId, 'performers', {
        performer_participant_ids: performerParticipantIds,
      }),
    [adminRequest],
  );
  const clearTop = useCallback(
    (blockId: string) => adminRequest('POST', blockId, 'clear_top'),
    [adminRequest],
  );
  const clearAll = useCallback(
    (blockId: string) => adminRequest('POST', blockId, 'clear_all'),
    [adminRequest],
  );
  const clearSuggestion = useCallback(
    (blockId: string, suggestionId: string) =>
      adminRequest('POST', blockId, `clear/${encodeURIComponent(suggestionId)}`),
    [adminRequest],
  );

  const submitSuggestion = useCallback(
    async (blockId: string, text: string): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await experienceFetch(buildUrl(blockId, 'suggestions'), {
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
    [code, experienceFetch, buildUrl, setSubmissionState],
  );

  const submitVote = useCallback(
    async (blockId: string, suggestionId: string): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      try {
        const res = await experienceFetch(buildUrl(blockId, 'votes'), {
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
    [code, experienceFetch, buildUrl, setSubmissionState],
  );

  const pressBuzzer = useCallback(
    async (blockId: string): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      try {
        const res = await experienceFetch(buildUrl(blockId, 'buzzer'), { method: 'POST' });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          const msg = data?.error || 'Failed to press buzzer';
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
    [code, experienceFetch, buildUrl],
  );

  return {
    startScene,
    endScene,
    forceNextScene,
    updatePerformers,
    clearTop,
    clearAll,
    clearSuggestion,
    submitSuggestion,
    submitVote,
    pressBuzzer,
    isSubmitting,
    error,
  };
}
