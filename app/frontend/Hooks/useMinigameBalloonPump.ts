import { useCallback, useEffect, useRef, useState } from 'react';

import { useAdminAuth } from '@cctv/contexts/AdminAuthContext';
import {
  BalloonPumpLeaderUpdate,
  useDispatchRegistry,
} from '@cctv/contexts/DispatchRegistryContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';

interface ActionResult {
  success: boolean;
  error?: string;
}

const MIN_PUMP_INTERVAL_MS = 100;

export function useMinigameBalloonPump() {
  const { code, experienceFetch } = useExperience();
  const { adminFetch } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);
  const lastPumpAtRef = useRef(0);
  const pendingFillRef = useRef<number | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const inflightRef = useRef(false);

  const buildAdminUrl = useCallback(
    (blockId: string, action: 'start' | 'end') =>
      `/api/experiences/${encodeURIComponent(code ?? '')}/blocks/${encodeURIComponent(blockId)}/minigame/balloon_pump/${action}`,
    [code],
  );

  const buildPumpUrl = useCallback(
    (blockId: string) =>
      `/api/experiences/${encodeURIComponent(code ?? '')}/blocks/${encodeURIComponent(blockId)}/minigame/balloon_pump/pump`,
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

  const sendPump = useCallback(
    async (blockId: string, fillAmount: number) => {
      if (inflightRef.current) {
        pendingFillRef.current = fillAmount;
        return;
      }

      inflightRef.current = true;
      try {
        await experienceFetch(buildPumpUrl(blockId), {
          method: 'POST',
          body: JSON.stringify({ fill_amount: fillAmount }),
        });
      } catch {
        // Network errors are non-fatal: next pump tick will retry with the latest fill
      } finally {
        inflightRef.current = false;
        const queued = pendingFillRef.current;
        if (queued !== null) {
          pendingFillRef.current = null;
          sendPump(blockId, queued);
        }
      }
    },
    [experienceFetch, buildPumpUrl],
  );

  const submitPump = useCallback(
    (blockId: string, fillAmount: number) => {
      if (!code) return;
      const now = Date.now();
      const elapsed = now - lastPumpAtRef.current;

      if (elapsed >= MIN_PUMP_INTERVAL_MS) {
        lastPumpAtRef.current = now;
        sendPump(blockId, fillAmount);
        if (flushTimerRef.current !== null) {
          window.clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }
      } else {
        pendingFillRef.current = fillAmount;
        if (flushTimerRef.current === null) {
          flushTimerRef.current = window.setTimeout(() => {
            flushTimerRef.current = null;
            const fill = pendingFillRef.current;
            if (fill !== null) {
              pendingFillRef.current = null;
              lastPumpAtRef.current = Date.now();
              sendPump(blockId, fill);
            }
          }, MIN_PUMP_INTERVAL_MS - elapsed);
        }
      }
    },
    [code, sendPump],
  );

  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  return { start, end, submitPump, error };
}

export function useBalloonPumpLeader(
  blockId: string,
  initial: BalloonPumpLeaderUpdate,
): BalloonPumpLeaderUpdate {
  const { registerBalloonPumpListener, unregisterBalloonPumpListener } = useDispatchRegistry();
  const [state, setState] = useState<BalloonPumpLeaderUpdate>(initial);
  const initialRef = useRef(initial);

  useEffect(() => {
    if (
      initial.leader_fill !== initialRef.current.leader_fill ||
      initial.target_units !== initialRef.current.target_units ||
      initial.leader_participant_id !== initialRef.current.leader_participant_id
    ) {
      initialRef.current = initial;
      setState(initial);
    }
  }, [initial]);

  useEffect(() => {
    registerBalloonPumpListener(blockId, (update) => {
      setState(update);
    });
    return () => unregisterBalloonPumpListener(blockId);
  }, [blockId, registerBalloonPumpListener, unregisterBalloonPumpListener]);

  return state;
}
