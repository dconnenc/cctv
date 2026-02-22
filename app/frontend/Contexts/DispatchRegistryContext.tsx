import { ReactNode, createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { FamilyFeudAction } from '@cctv/pages/Block/FamilyFeudManager/familyFeudReducer';
import { DrawingUpdateMessage } from '@cctv/types';

export interface DispatchRegistryContextType {
  registerFamilyFeudDispatch: (
    blockId: string,
    dispatch: (action: FamilyFeudAction) => void,
  ) => void;
  unregisterFamilyFeudDispatch: (blockId: string) => void;
  getFamilyFeudDispatch: (blockId: string) => ((action: FamilyFeudAction) => void) | undefined;
  registerLobbyDrawingDispatch: (dispatch: (action: DrawingUpdateMessage) => void) => void;
  unregisterLobbyDrawingDispatch: () => void;
  getLobbyDrawingDispatch: () => ((action: DrawingUpdateMessage) => void) | null;
}

const DispatchRegistryContext = createContext<DispatchRegistryContextType | undefined>(undefined);

export function DispatchRegistryProvider({ children }: { children: ReactNode }) {
  const familyFeudDispatchRegistry = useRef<Map<string, (action: FamilyFeudAction) => void>>(
    new Map(),
  );
  const lobbyDrawingDispatchRef = useRef<((action: DrawingUpdateMessage) => void) | null>(null);

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

  const registerLobbyDrawingDispatch = useCallback(
    (dispatch: (action: DrawingUpdateMessage) => void) => {
      lobbyDrawingDispatchRef.current = dispatch;
    },
    [],
  );

  const unregisterLobbyDrawingDispatch = useCallback(() => {
    lobbyDrawingDispatchRef.current = null;
  }, []);

  const getLobbyDrawingDispatch = useCallback(() => {
    return lobbyDrawingDispatchRef.current;
  }, []);

  const value = useMemo<DispatchRegistryContextType>(
    () => ({
      registerFamilyFeudDispatch,
      unregisterFamilyFeudDispatch,
      getFamilyFeudDispatch,
      registerLobbyDrawingDispatch,
      unregisterLobbyDrawingDispatch,
      getLobbyDrawingDispatch,
    }),
    [
      registerFamilyFeudDispatch,
      unregisterFamilyFeudDispatch,
      getFamilyFeudDispatch,
      registerLobbyDrawingDispatch,
      unregisterLobbyDrawingDispatch,
      getLobbyDrawingDispatch,
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
