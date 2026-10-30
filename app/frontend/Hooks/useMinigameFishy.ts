import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';

interface ActionResult {
  success: boolean;
  error?: string;
}

type FishyAction = 'start' | 'end' | 'restart';

const FAILURE_MESSAGES = {
  start: 'Failed to start minigame',
  end: 'Failed to end minigame',
  restart: 'Failed to restart minigame',
} satisfies Record<FishyAction, string>;

export function useMinigameFishy() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (blockId: string, action: FishyAction): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      const res = await adminFetch(
        `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/minigame/fishy/${action}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const msg = data?.error || FAILURE_MESSAGES[action];
        setError(msg);
        return { success: false, error: msg };
      }
      return { success: true };
    },
    [code, adminFetch],
  );

  const start = useCallback((blockId: string) => run(blockId, 'start'), [run]);
  const end = useCallback((blockId: string) => run(blockId, 'end'), [run]);
  const restart = useCallback((blockId: string) => run(blockId, 'restart'), [run]);

  return { start, end, restart, error };
}
