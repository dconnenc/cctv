import { ReactNode, createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { FamilyFeudAction } from '@cctv/pages/Block/FamilyFeudManager/familyFeudReducer';

export interface DispatchRegistryContextType {
  registerFamilyFeudDispatch: (
    blockId: string,
    dispatch: (action: FamilyFeudAction) => void,
  ) => void;
  unregisterFamilyFeudDispatch: (blockId: string) => void;
  getFamilyFeudDispatch: (blockId: string) => ((action: FamilyFeudAction) => void) | undefined;
}

const DispatchRegistryContext = createContext<DispatchRegistryContextType | undefined>(undefined);

export function DispatchRegistryProvider({ children }: { children: ReactNode }) {
  const familyFeudDispatchRegistry = useRef<Map<string, (action: FamilyFeudAction) => void>>(
    new Map(),
  );

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

  const value = useMemo<DispatchRegistryContextType>(
    () => ({
      registerFamilyFeudDispatch,
      unregisterFamilyFeudDispatch,
      getFamilyFeudDispatch,
    }),
    [registerFamilyFeudDispatch, unregisterFamilyFeudDispatch, getFamilyFeudDispatch],
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
