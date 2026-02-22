import { ReactNode } from 'react';

import { ExperienceContextType } from '@cctv/types';

import { AuthProvider, useAuth } from './AuthContext';
import { DispatchRegistryProvider, useDispatchRegistry } from './DispatchRegistryContext';
import { ExperienceStateProvider, useExperienceState } from './ExperienceStateContext';
import { WebSocketProvider, useWebSocket } from './WebSocketContext';

interface ExperienceProviderProps {
  children: ReactNode;
}

export function ExperienceProvider({ children }: ExperienceProviderProps) {
  return (
    <AuthProvider>
      <ExperienceStateProvider>
        <DispatchRegistryProvider>
          <WebSocketProvider>{children}</WebSocketProvider>
        </DispatchRegistryProvider>
      </ExperienceStateProvider>
    </AuthProvider>
  );
}

export function useExperience(): ExperienceContextType {
  const auth = useAuth();
  const state = useExperienceState();
  const ws = useWebSocket();
  const dispatch = useDispatchRegistry();

  return {
    experience: state.experience,
    participant: state.participant,
    code: auth.code,
    jwt: auth.jwt,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    experienceStatus: state.experienceStatus,
    error: state.error,
    setJWT: auth.setJWT,
    clearJWT: auth.clearJWT,
    experienceFetch: auth.experienceFetch,
    wsConnected: ws.wsConnected,
    wsError: ws.wsError,
    monitorView: state.monitorView,
    participantView: state.participantView,
    impersonatedParticipantId: state.impersonatedParticipantId,
    setImpersonatedParticipantId: state.setImpersonatedParticipantId,
    registerFamilyFeudDispatch: dispatch.registerFamilyFeudDispatch,
    unregisterFamilyFeudDispatch: dispatch.unregisterFamilyFeudDispatch,
    registerLobbyDrawingDispatch: dispatch.registerLobbyDrawingDispatch,
    unregisterLobbyDrawingDispatch: dispatch.unregisterLobbyDrawingDispatch,
    experiencePerform: ws.experiencePerform,
  };
}
