import { ReactNode, createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { FamilyFeudAction } from '@cctv/pages/Block/FamilyFeudManager/familyFeudReducer';

export interface BalloonPumpLeaderState {
  leader_fill: number;
  leader_participant_id: string | null;
}

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
}

const DispatchRegistryContext = createContext<DispatchRegistryContextType | undefined>(undefined);

export function DispatchRegistryProvider({ children }: { children: ReactNode }) {
  const familyFeudDispatchRegistry = useRef<Map<string, (action: FamilyFeudAction) => void>>(
    new Map(),
  );
  const balloonPumpLeaderDispatchRegistry = useRef<
    Map<string, (state: BalloonPumpLeaderState) => void>
  >(new Map());

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

  const value = useMemo<DispatchRegistryContextType>(
    () => ({
      registerFamilyFeudDispatch,
      unregisterFamilyFeudDispatch,
      getFamilyFeudDispatch,
      registerBalloonPumpLeaderDispatch,
      unregisterBalloonPumpLeaderDispatch,
      getBalloonPumpLeaderDispatch,
    }),
    [
      registerFamilyFeudDispatch,
      unregisterFamilyFeudDispatch,
      getFamilyFeudDispatch,
      registerBalloonPumpLeaderDispatch,
      unregisterBalloonPumpLeaderDispatch,
      getBalloonPumpLeaderDispatch,
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
