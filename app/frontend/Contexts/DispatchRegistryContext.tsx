import { ReactNode, createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { FamilyFeudAction } from '@cctv/pages/Block/FamilyFeudManager/familyFeudReducer';
import { MinigameFishyFrameMessage } from '@cctv/types';

export interface BalloonPumpLeaderState {
  leader_fill: number;
}

export type FishyFrameListener = (frame: MinigameFishyFrameMessage) => void;

export interface DispatchRegistryContextType {
  registerFamilyFeudDispatch: (
    blockId: string,
    dispatch: (action: FamilyFeudAction) => void,
  ) => void;
  unregisterFamilyFeudDispatch: (blockId: string) => void;
  getFamilyFeudDispatch: (blockId: string) => ((action: FamilyFeudAction) => void) | undefined;
  registerBalloonPumpLeaderDispatch: (
    blockId: string,
    dispatch: (state: BalloonPumpLeaderState) => void,
  ) => void;
  unregisterBalloonPumpLeaderDispatch: (blockId: string) => void;
  getBalloonPumpLeaderDispatch: (
    blockId: string,
  ) => ((state: BalloonPumpLeaderState) => void) | undefined;
  // Fishy frames fan out to every mounted stage for the block (the manage page
  // can show the monitor preview and the block detail at once), so listeners
  // are a set rather than a single dispatch. A newly registered listener is
  // primed with the last keyframe, which usually lands before it mounts.
  registerFishyFrameListener: (blockId: string, listener: FishyFrameListener) => void;
  unregisterFishyFrameListener: (blockId: string, listener: FishyFrameListener) => void;
  dispatchFishyFrame: (frame: MinigameFishyFrameMessage) => void;
}

const DispatchRegistryContext = createContext<DispatchRegistryContextType | undefined>(undefined);

export function DispatchRegistryProvider({ children }: { children: ReactNode }) {
  const familyFeudDispatchRegistry = useRef<Map<string, (action: FamilyFeudAction) => void>>(
    new Map(),
  );
  const balloonPumpLeaderDispatchRegistry = useRef<
    Map<string, (state: BalloonPumpLeaderState) => void>
  >(new Map());

  const fishyFrameListeners = useRef<Map<string, Set<FishyFrameListener>>>(new Map());
  const fishyKeyframes = useRef<Map<string, MinigameFishyFrameMessage>>(new Map());

  const registerFamilyFeudDispatch = useCallback(
    (blockId: string, dispatch: (action: FamilyFeudAction) => void) => {
      familyFeudDispatchRegistry.current.set(blockId, dispatch);
    },
    [],
  );

  const unregisterFamilyFeudDispatch = useCallback((blockId: string) => {
    familyFeudDispatchRegistry.current.delete(blockId);
  }, []);

  const getFamilyFeudDispatch = useCallback((blockId: string) => {
    return familyFeudDispatchRegistry.current.get(blockId);
  }, []);

  const registerBalloonPumpLeaderDispatch = useCallback(
    (blockId: string, dispatch: (state: BalloonPumpLeaderState) => void) => {
      balloonPumpLeaderDispatchRegistry.current.set(blockId, dispatch);
    },
    [],
  );

  const unregisterBalloonPumpLeaderDispatch = useCallback((blockId: string) => {
    balloonPumpLeaderDispatchRegistry.current.delete(blockId);
  }, []);

  const getBalloonPumpLeaderDispatch = useCallback((blockId: string) => {
    return balloonPumpLeaderDispatchRegistry.current.get(blockId);
  }, []);

  const registerFishyFrameListener = useCallback(
    (blockId: string, listener: FishyFrameListener) => {
      const listeners = fishyFrameListeners.current.get(blockId) ?? new Set();
      listeners.add(listener);
      fishyFrameListeners.current.set(blockId, listeners);
      const keyframe = fishyKeyframes.current.get(blockId);
      if (keyframe) listener(keyframe);
    },
    [],
  );

  const unregisterFishyFrameListener = useCallback(
    (blockId: string, listener: FishyFrameListener) => {
      fishyFrameListeners.current.get(blockId)?.delete(listener);
    },
    [],
  );

  const dispatchFishyFrame = useCallback((frame: MinigameFishyFrameMessage) => {
    if (frame.keyframe) fishyKeyframes.current.set(frame.block_id, frame);
    fishyFrameListeners.current.get(frame.block_id)?.forEach((listener) => listener(frame));
  }, []);

  const value = useMemo<DispatchRegistryContextType>(
    () => ({
      registerFamilyFeudDispatch,
      unregisterFamilyFeudDispatch,
      getFamilyFeudDispatch,
      registerBalloonPumpLeaderDispatch,
      unregisterBalloonPumpLeaderDispatch,
      getBalloonPumpLeaderDispatch,
      registerFishyFrameListener,
      unregisterFishyFrameListener,
      dispatchFishyFrame,
    }),
    [
      registerFamilyFeudDispatch,
      unregisterFamilyFeudDispatch,
      getFamilyFeudDispatch,
      registerBalloonPumpLeaderDispatch,
      unregisterBalloonPumpLeaderDispatch,
      getBalloonPumpLeaderDispatch,
      registerFishyFrameListener,
      unregisterFishyFrameListener,
      dispatchFishyFrame,
    ],
  );

  return (
    <DispatchRegistryContext.Provider value={value}>{children}</DispatchRegistryContext.Provider>
  );
}

export function useDispatchRegistry() {
  const context = useContext(DispatchRegistryContext);
  if (context === undefined) {
    throw new Error('useDispatchRegistry must be used within a DispatchRegistryProvider');
  }
  return context;
}
