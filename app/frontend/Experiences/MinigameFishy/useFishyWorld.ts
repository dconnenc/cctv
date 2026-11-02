import { useEffect, useRef, useState } from 'react';

import { useDispatchRegistry } from '@cctv/contexts/DispatchRegistryContext';
import type { MinigameFishyBlock, MinigameFishyFrameMessage } from '@cctv/types';

import { FishyWorld } from './fishyWorld';

export interface FishySummary {
  alive: number;
  leaders: Array<{ slot: number; size: number }>;
  ownSize: number | null;
  ownEatenBy: number | null;
}

export const SUMMARY_INTERVAL_MS = 250;
const LEADER_COUNT = 5;

/**
 * Holds this game's live world outside React state: frames mutate it in place
 * and the canvas reads it every animation frame. Frames from any other game
 * generation (e.g. a cached keyframe from before a restart) are ignored.
 */
export function useFishyWorld(block: MinigameFishyBlock) {
  const { registerFishyFrameListener, unregisterFishyFrameListener } = useDispatchRegistry();
  const startedAt = block.payload.started_at;
  const worldRef = useRef(new FishyWorld());

  useEffect(() => {
    worldRef.current = new FishyWorld();
    if (!startedAt) return;

    const listener = (frame: MinigameFishyFrameMessage) => {
      if (frame.started_at === startedAt) worldRef.current.apply(frame, performance.now());
    };
    registerFishyFrameListener(block.id, listener);
    return () => unregisterFishyFrameListener(block.id, listener);
  }, [block.id, startedAt, registerFishyFrameListener, unregisterFishyFrameListener]);

  return worldRef;
}

export function summarize(world: FishyWorld, ownSlot: number | null): FishySummary {
  const own = ownSlot === null ? undefined : world.players.get(ownSlot);
  return {
    alive: world.aliveCount(),
    leaders: world.leaders(LEADER_COUNT),
    ownSize: own ? own.toSize : null,
    ownEatenBy: ownSlot === null ? null : (world.out.get(ownSlot) ?? null),
  };
}

/** A low-rate React view of the world for HUDs that don't draw the canvas. */
export function useFishySummary(block: MinigameFishyBlock, ownSlot: number | null = null) {
  const worldRef = useFishyWorld(block);
  const [summary, setSummary] = useState<FishySummary>(() => summarize(worldRef.current, ownSlot));

  useEffect(() => {
    const id = window.setInterval(
      () => setSummary(summarize(worldRef.current, ownSlot)),
      SUMMARY_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [worldRef, ownSlot]);

  return summary;
}
