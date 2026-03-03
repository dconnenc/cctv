import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useParams } from 'react-router-dom';

import { useUser } from '@cctv/contexts/UserContext';
import {
  getStoredAdminJWT,
  isJWTExpired,
  removeStoredAdminJWT,
  setStoredAdminJWT,
} from '@cctv/contexts/jwtStorage';
import { AuthError } from '@cctv/types';
import { qaLogger } from '@cctv/utils';

import { useAuth } from './AuthContext';

export interface AdminAuthContextType {
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  isAdminLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { code } = useParams<{ code: string }>();
  const currentCode = code ?? '';
  const { isAdmin } = useUser();
  const { setAdminJWT: setContextAdminJWT } = useAuth();

  // Synchronously initialize from localStorage so the JWT is available before effects run.
  const [adminJWT, setAdminJWTState] = useState<string | undefined>(() => {
    if (!currentCode) return undefined;
    const stored = getStoredAdminJWT(currentCode);
    return stored && !isJWTExpired(stored) ? stored : undefined;
  });

  const [isAdminLoading, setIsAdminLoading] = useState(() => {
    if (!currentCode || !isAdmin) return false;
    const stored = getStoredAdminJWT(currentCode);
    return !(stored && !isJWTExpired(stored));
  });

  const applyAdminJWT = useCallback(
    (token: string) => {
      if (!currentCode) return;
      setStoredAdminJWT(currentCode, token);
      setAdminJWTState(token);
      setContextAdminJWT(token);
    },
    [currentCode, setContextAdminJWT],
  );

  const revokeAdminJWT = useCallback(() => {
    if (!currentCode) return;
    removeStoredAdminJWT(currentCode);
    setAdminJWTState(undefined);
    setContextAdminJWT(undefined);
  }, [currentCode, setContextAdminJWT]);

  // Admin JWT is obtained by exchanging session credentials (cookie-based)
  // for a short-lived experience-scoped JWT, hence credentials: 'include'.
  const fetchAdminJWT = useCallback(async (): Promise<string | undefined> => {
    if (!currentCode || !isAdmin) return undefined;

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
        applyAdminJWT(data.jwt);
        return data.jwt as string;
      } else {
        throw new Error('Invalid admin JWT response');
      }
    } catch (err) {
      console.error('Error fetching admin JWT:', err);
      return undefined;
    }
  }, [currentCode, isAdmin, applyAdminJWT]);

  // Sync the stored admin JWT to AuthContext before other effects run, so that
  // WebSocketContext's useEffect sees the correct JWT on its first execution.
  useLayoutEffect(() => {
    if (adminJWT) {
      setContextAdminJWT(adminJWT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch a fresh admin JWT from the API if none was found in localStorage.
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current || adminJWT || !isAdmin) return;
    hasFetchedRef.current = true;

    qaLogger(
      getStoredAdminJWT(currentCode)
        ? 'Stored admin JWT is expired; fetching fresh token'
        : 'No stored admin JWT; fetching from API',
    );
    fetchAdminJWT().finally(() => setIsAdminLoading(false));
  }, [currentCode, isAdmin, adminJWT, fetchAdminJWT]);

  const adminFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!currentCode) throw new Error('No experience code available');

      const headers: RequestInit['headers'] = adminJWT
        ? {
            Authorization: `Bearer ${adminJWT}`,
            'Content-Type': 'application/json',
            ...options.headers,
          }
        : {
            'Content-Type': 'application/json',
            ...options.headers,
          };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        // Admin JWTs can be auto-refreshed via session auth. Attempt one retry.
        qaLogger('401 on admin JWT; clearing and retrying with fresh token');
        revokeAdminJWT();
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
            // Session itself has expired; nothing to retry.
            qaLogger('401 on retried admin JWT; session also expired');
            revokeAdminJWT();
          }
        }
        const err: AuthError = new Error('Authentication expired');
        err.code = 401;
        throw err;
      }

      if (!response.ok) {
        qaLogger(`Failed adminFetch: ${response.status}`);
        throw new Error(`Failed to fetch ${url} (status ${response.status})`);
      }

      return response;
    },
    [adminJWT, currentCode, revokeAdminJWT, fetchAdminJWT],
  );

  const value = useMemo<AdminAuthContextType>(
    () => ({ adminFetch, isAdminLoading }),
    [adminFetch, isAdminLoading],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
