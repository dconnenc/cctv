import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { GuessWhoMonitorView } from '@cctv/types';

interface DispatchResult {
  success: boolean;
  error?: string;
}

export function useGuessWhoControls() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (
      blockId: string,
      path: string,
      init: RequestInit = {},
    ): Promise<DispatchResult | null> => {
      if (!code || !blockId) return null;

      setIsLoading(true);
      setError(null);

      const url = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/guess_who/${path}`;

      try {
        const res = await adminFetch(url, { method: 'POST', ...init });
        const data = await res.json();
        if (!res.ok || data?.success === false) {
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
      } finally {
        setIsLoading(false);
      }
    },
    [code, adminFetch],
  );

  const jsonBody = (body: Record<string, unknown>): RequestInit => ({
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return {
    start: (blockId: string) => send(blockId, 'start'),
    rerollMystery: (blockId: string, contestantIndex: 0 | 1) =>
      send(blockId, 'reroll_mystery', jsonBody({ contestant_index: contestantIndex })),
    curateClues: (
      blockId: string,
      contestantIndex: 0 | 1,
      clueOrder: string[],
      hiddenClueIds: string[],
    ) =>
      send(blockId, 'clues', {
        method: 'PATCH',
        ...jsonBody({
          contestant_index: contestantIndex,
          clue_order: clueOrder,
          hidden_clue_ids: hiddenClueIds,
        }),
      }),
    advanceClue: (blockId: string, contestantIndex: 0 | 1, direction: 1 | -1) =>
      send(blockId, 'advance_clue', jsonBody({ contestant_index: contestantIndex, direction })),
    setMonitorView: (blockId: string, view: GuessWhoMonitorView) =>
      send(blockId, 'monitor_view', jsonBody({ view })),
    dispatchPoll: (blockId: string, contestantIndex: 0 | 1) =>
      send(blockId, 'dispatch_poll', jsonBody({ contestant_index: contestantIndex })),
    concludePoll: (blockId: string) => send(blockId, 'conclude_poll'),
    reveal: (blockId: string) => send(blockId, 'reveal'),
    setThemeMusic: (blockId: string, playing: boolean) =>
      send(blockId, 'theme_music', jsonBody({ playing })),
    restartThemeMusic: (blockId: string) => send(blockId, 'theme_music/restart'),
    isLoading,
    error,
  };
}
