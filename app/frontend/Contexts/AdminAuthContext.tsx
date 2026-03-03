import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
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

export interface AdminAuthContextType {
  adminJWT: string | undefined;
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  isAdminLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { code } = useParams<{ code: string }>();
  const currentCode = code ?? '';
  const { isAdmin } = useUser();

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
    },
    [currentCode],
  );

  const revokeAdminJWT = useCallback(() => {
    if (!currentCode) return;
    removeStoredAdminJWT(currentCode);
    setAdminJWTState(undefined);
  }, [currentCode]);

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

  // Fetch a fresh admin JWT from the API if none was found in localStorage.
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current || adminJWT || !isAdmin) return;
    hasFetchedRef.current = true;

    qaLogger('No valid admin JWT found; fetching from API');
    fetchAdminJWT().finally(() => setIsAdminLoading(false));
  }, [currentCode, isAdmin, adminJWT, fetchAdminJWT]);

  const adminFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!currentCode) throw new Error('No experience code available');

      const makeRequest = async (token: string): Promise<Response> => {
        const headers: RequestInit['headers'] = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        };
        return fetch(url, { ...options, headers });
      };

      // No JWT client-side - attempt session refresh before giving up,
      // same recovery path as receiving a 401 on a stale token.
      const token = adminJWT ?? (await fetchAdminJWT());
      if (!token) {
        const err: AuthError = new Error('Authentication expired');
        err.code = 401;
        throw err;
      }

      const response = await makeRequest(token);

      if (response.status === 401) {
        // Token was rejected - clear it and attempt one session refresh.
        qaLogger('401 on admin JWT; clearing and retrying with fresh token');
        revokeAdminJWT();
        const newJWT = await fetchAdminJWT();
        if (newJWT) {
          const retryResponse = await makeRequest(newJWT);
          if (retryResponse.ok) return retryResponse;
          if (retryResponse.status === 401) {
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
    () => ({ adminJWT, adminFetch, isAdminLoading }),
    [adminJWT, adminFetch, isAdminLoading],
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
