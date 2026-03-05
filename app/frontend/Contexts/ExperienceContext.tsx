import { ReactNode } from 'react';

import { useExperienceRoute } from '@cctv/hooks/useExperienceRoute';
import { ExperienceContextType } from '@cctv/types';

import { AdminAuthProvider } from './AdminAuthContext';
import { AuthProvider, useAuth } from './AuthContext';
import { DispatchRegistryProvider, useDispatchRegistry } from './DispatchRegistryContext';
import { ExperienceStateProvider, useExperienceState } from './ExperienceStateContext';
import { LobbyDrawingProvider } from './LobbyDrawingContext';
import { WebSocketProvider, useWebSocket } from './WebSocketContext';

interface ExperienceProviderProps {
  children: ReactNode;
}

export function ExperienceProvider({ children }: ExperienceProviderProps) {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ExperienceStateProvider>
          <DispatchRegistryProvider>
            <LobbyDrawingProvider>
              <WebSocketProvider>{children}</WebSocketProvider>
            </LobbyDrawingProvider>
          </DispatchRegistryProvider>
        </ExperienceStateProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export function useExperience(): ExperienceContextType {
  const auth = useAuth();
  const state = useExperienceState();
  const ws = useWebSocket();
  const dispatch = useDispatchRegistry();
  const { code } = useExperienceRoute();

  return {
    experience: state.experience,
    participant: state.participant,
    code,
    jwt: auth.jwt,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    experienceStatus: state.experienceStatus,
    error: state.error,
    setParticipantJWT: auth.setParticipantJWT,
    clearAuth: auth.clearAuth,
    experienceFetch: auth.experienceFetch,
    wsConnected: ws.wsConnected,
    wsReady: state.wsReady,
    wsError: ws.wsError,
    monitorView: state.monitorView,
    participantView: state.participantView,
    impersonatedParticipantId: state.impersonatedParticipantId,
    setImpersonatedParticipantId: state.setImpersonatedParticipantId,
    registerFamilyFeudDispatch: dispatch.registerFamilyFeudDispatch,
    unregisterFamilyFeudDispatch: dispatch.unregisterFamilyFeudDispatch,
    experiencePerform: ws.experiencePerform,
  };
}
