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
  qaLogger,
  removeStoredAdminJWT,
  setStoredAdminJWT,
} from '@cctv/utils';

const setStoredJWT = (code: string, jwt: string) => localStorage.setItem(getJWTKey(code), jwt);
const removeStoredJWT = (code: string) => localStorage.removeItem(getJWTKey(code));

export interface AuthContextType {
  code: string;
  jwt?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isManagePage: boolean;
  isMonitorPage: boolean;
  setJWT: (token: string) => void;
  clearJWT: () => void;
  experienceFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const { isAdmin } = useUser();

  const [jwt, setJWTState] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const currentCode = code || '';
  const isManagePage = location.pathname.includes('/manage');
  const isMonitorPage = location.pathname.includes('/monitor');

  const clearJWT = useCallback(() => {
    if (currentCode) {
      removeStoredJWT(currentCode);
      removeStoredAdminJWT(currentCode);
    }
    setJWTState(undefined);
  }, [currentCode]);

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
        qaLogger('401 invalid response; clearing experience JWT');
        if (jwt) clearJWT();
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
    [jwt, currentCode, clearJWT],
  );

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
      } else {
        throw new Error('Invalid admin JWT response');
      }
    } catch (err) {
      console.error('Error fetching admin JWT:', err);
    }
  }, [currentCode, isAdmin]);

  useEffect(() => {
    if (!currentCode) return;

    qaLogger(`Experience code changed to ${currentCode} — resetting auth`);
    setIsLoading(true);

    if ((isManagePage || isMonitorPage) && isAdmin) {
      const storedAdminJWT = getStoredAdminJWT(currentCode);
      if (storedAdminJWT) {
        qaLogger('Found stored admin JWT; setting in context');
        setJWTState(storedAdminJWT);
        setIsLoading(false);
      } else {
        qaLogger('No stored admin JWT; fetching from API');
        fetchAdminJWT().finally(() => setIsLoading(false));
      }
    } else {
      const storedJWT = getStoredJWT(currentCode);
      if (storedJWT) {
        qaLogger('Found stored participant JWT; setting in context');
        setJWTState(storedJWT);
      } else {
        qaLogger('No stored participant JWT');
        setJWTState(undefined);
      }
      setIsLoading(false);
    }
  }, [currentCode, isManagePage, isMonitorPage, isAdmin, fetchAdminJWT]);

  const setJWT = useCallback(
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
      code: currentCode,
      jwt,
      isAuthenticated: jwt !== undefined && currentCode !== '',
      isLoading,
      isManagePage,
      isMonitorPage,
      setJWT,
      clearJWT,
      experienceFetch,
    }),
    [currentCode, jwt, isLoading, isManagePage, isMonitorPage, setJWT, clearJWT, experienceFetch],
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
