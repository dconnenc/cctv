import { useCallback, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';

interface ActionResult {
  success: boolean;
  error?: string;
}

export function useCollaborativeDrawing() {
  const { code } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(
    async (blockId: string, action: 'start' | 'end' | 'restart'): Promise<ActionResult> => {
      if (!code) return { success: false, error: 'Missing experience code' };
      setError(null);
      const res = await adminFetch(
        `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/collaborative_drawing/${action}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const msg = data?.error || `Failed to ${action} collaborative drawing`;
        setError(msg);
        return { success: false, error: msg };
      }
      return { success: true };
    },
    [code, adminFetch],
  );

  const startRound = useCallback((blockId: string) => runAction(blockId, 'start'), [runAction]);
  const endRound = useCallback((blockId: string) => runAction(blockId, 'end'), [runAction]);
  const restart = useCallback((blockId: string) => runAction(blockId, 'restart'), [runAction]);

  return { startRound, endRound, restart, error };
}
