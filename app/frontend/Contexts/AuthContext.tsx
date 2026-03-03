import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useParams } from 'react-router-dom';

import {
  getStoredParticipantJWT,
  removeStoredAdminJWT,
  removeStoredParticipantJWT,
  setStoredParticipantJWT,
} from '@cctv/contexts/jwtStorage';
import { AuthError } from '@cctv/types';
import { qaLogger } from '@cctv/utils';

export interface AuthContextType {
  jwt?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  setParticipantJWT: (token: string) => void;
  clearAuth: () => void;
  experienceFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { code } = useParams<{ code: string }>();
  const currentCode = code ?? '';

  const [jwt, setJWTState] = useState<string | undefined>(() => {
    if (!currentCode) return undefined;
    return getStoredParticipantJWT(currentCode) ?? undefined;
  });
  const [isLoading] = useState(false);

  const revokeParticipantJWT = useCallback(() => {
    if (!currentCode) return;
    removeStoredParticipantJWT(currentCode);
    setJWTState(undefined);
  }, [currentCode]);

  const clearAuth = useCallback(() => {
    if (currentCode) {
      removeStoredParticipantJWT(currentCode);
      removeStoredAdminJWT(currentCode);
    }
    setJWTState(undefined);
  }, [currentCode]);

  const experienceFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!currentCode) throw new Error('No experience code available');

      if (!jwt) {
        const err: AuthError = new Error('No JWT available');
        err.code = 401;
        throw err;
      }

      const headers: RequestInit['headers'] = {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        qaLogger('401 on participant JWT; clearing');
        revokeParticipantJWT();
        const err: AuthError = new Error('Authentication expired');
        err.code = 401;
        throw err;
      }

      if (!response.ok) {
        qaLogger(`Failed experienceFetch: ${response.status}`);
        throw new Error(`Failed to fetch ${url} (status ${response.status})`);
      }

      return response;
    },
    [jwt, currentCode, revokeParticipantJWT],
  );

  const setParticipantJWT = useCallback(
    (token: string) => {
      if (!currentCode) {
        console.warn('Cannot set JWT without an experience code');
        return;
      }
      setStoredParticipantJWT(currentCode, token);
      setJWTState(token);
    },
    [currentCode],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      jwt,
      isAuthenticated: jwt !== undefined && currentCode !== '',
      isLoading,
      setParticipantJWT,
      clearAuth,
      experienceFetch,
    }),
    [jwt, currentCode, isLoading, setParticipantJWT, clearAuth, experienceFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
