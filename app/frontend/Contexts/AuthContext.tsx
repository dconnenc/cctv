import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useLocation, useParams } from 'react-router-dom';

import { useUser } from '@cctv/contexts/UserContext';
import { AuthError } from '@cctv/types';
import {
  getJWTKey,
  getStoredAdminJWT,
  getStoredJWT,
  isJWTExpired,
  qaLogger,
  removeStoredAdminJWT,
  setStoredAdminJWT,
} from '@cctv/utils';

const setStoredJWT = (code: string, jwt: string) => localStorage.setItem(getJWTKey(code), jwt);
const removeStoredJWT = (code: string) => localStorage.removeItem(getJWTKey(code));

export function useExperienceRoute() {
  const { code } = useParams<{ code: string }>();
  const { pathname } = useLocation();
  return {
    code: code ?? '',
    isManagePage: pathname.includes('/manage'),
    isMonitorPage: pathname.includes('/monitor'),
  };
}

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
  const { code: currentCode, isManagePage } = useExperienceRoute();
  const { isAdmin, isLoading: userIsLoading } = useUser();

  const [jwt, setJWTState] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const clearAdminJWT = useCallback(() => {
    if (currentCode) removeStoredAdminJWT(currentCode);
  }, [currentCode]);

  const clearParticipantJWT = useCallback(() => {
    if (currentCode) removeStoredJWT(currentCode);
    setJWTState(undefined);
  }, [currentCode]);

  const clearAuth = useCallback(() => {
    if (currentCode) {
      removeStoredJWT(currentCode);
      removeStoredAdminJWT(currentCode);
    }
    setJWTState(undefined);
  }, [currentCode]);

  const fetchAdminJWT = useCallback(async () => {
    if (!currentCode || !isAdmin) return;

    try {
      qaLogger('Fetching admin JWT');
      const response = await fetch(
        `/api/experiences/${encodeURIComponent(currentCode)}/admin_token`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) throw new Error('Failed to fetch admin JWT');

      const data = await response.json();

      if (data?.success && data?.jwt) {
        qaLogger('Admin JWT received');
        setStoredAdminJWT(currentCode, data.jwt);
        setJWTState(data.jwt);
        return data.jwt as string;
      } else {
        throw new Error('Invalid admin JWT response');
      }
    } catch (err) {
      console.error('Error fetching admin JWT:', err);
      return undefined;
    }
  }, [currentCode, isAdmin]);

  const experienceFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!currentCode) throw new Error('No experience code available');

      const headers: RequestInit['headers'] = jwt
        ? {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
            ...options.headers,
          }
        : {
            'Content-Type': 'application/json',
            ...options.headers,
          };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        const isAdminJWT = !!(jwt && jwt === getStoredAdminJWT(currentCode));
        if (isAdminJWT) {
          qaLogger('401 on admin JWT; clearing and retrying with fresh token');
          clearAdminJWT();
          const newJWT = await fetchAdminJWT();
          if (newJWT) {
            const retryHeaders: RequestInit['headers'] = {
              Authorization: `Bearer ${newJWT}`,
              'Content-Type': 'application/json',
              ...options.headers,
            };
            const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
            if (retryResponse.ok) return retryResponse;
            if (retryResponse.status === 401) {
              qaLogger('401 on retried admin JWT; session also expired');
              clearAdminJWT();
              setJWTState(undefined);
            }
          }
        } else {
          qaLogger('401 on participant JWT; clearing');
          clearParticipantJWT();
        }
        const err: AuthError = new Error('Authentication expired');
        err.code = 401;
        throw err;
      }

      if (!response.ok) {
        qaLogger(`Failed experienceFetch: ${response.status}`);
        throw new Error(`Failed to load experience (status ${response.status})`);
      }

      return response;
    },
    [jwt, currentCode, clearAdminJWT, clearParticipantJWT, fetchAdminJWT],
  );

  useEffect(() => {
    if (!currentCode || userIsLoading) return;

    qaLogger(`Initializing auth for experience: ${currentCode}`);
    setIsLoading(true);

    if (isManagePage && isAdmin) {
      const storedAdminJWT = getStoredAdminJWT(currentCode);
      if (storedAdminJWT && !isJWTExpired(storedAdminJWT)) {
        qaLogger('Found valid stored admin JWT; setting in context');
        setJWTState(storedAdminJWT);
        setIsLoading(false);
      } else {
        if (storedAdminJWT) {
          qaLogger('Stored admin JWT is expired; fetching fresh token');
        } else {
          qaLogger('No stored admin JWT; fetching from API');
        }
        fetchAdminJWT().finally(() => setIsLoading(false));
      }
    } else {
      const storedJWT = getStoredJWT(currentCode);
      if (storedJWT) {
        qaLogger('Found stored participant JWT; setting in context');
        setJWTState(storedJWT);
      } else {
        qaLogger('No stored participant JWT');
      }
      setIsLoading(false);
    }
  }, [currentCode, isManagePage, isAdmin, userIsLoading, fetchAdminJWT]);

  const setParticipantJWT = useCallback(
    (token: string) => {
      if (!currentCode) {
        console.warn('Cannot set JWT without an experience code');
        return;
      }
      setStoredJWT(currentCode, token);
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
