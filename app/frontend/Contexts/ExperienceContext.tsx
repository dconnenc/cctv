import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { qaLogger } from '@cctv/utils';

interface Experience {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'paused' | 'finished' | 'archived';
  blocks: any;
  participants?: Array<{
    id: string;
    name?: string;
    email: string;
  }>;
}

interface ExperienceUser {
  id: string;
  name?: string;
  email: string;
}

interface ExperienceContextType {
  experience: Experience | null;
  user: ExperienceUser | null;
  code: string;
  jwt: string | null;

  isAuthenticated: boolean;
  isLoading: boolean;
  isPolling: boolean;
  experienceStatus: 'lobby' | 'active';
  error: string | null;

  setJWT: (token: string) => void;
  clearJWT: () => void;
  experienceFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const ExperienceContext = createContext<ExperienceContextType | undefined>(undefined);

// Helper functions for authenticating users with experiences
// TODO: use id, not code here
const getJWTKey = (code: string) => `experience_jwt_${code}`;
const getStoredJWT = (code: string) => localStorage.getItem(getJWTKey(code));
const setStoredJWT = (code: string, jwt: string) => localStorage.setItem(getJWTKey(code), jwt);
const removeStoredJWT = (code: string) => localStorage.removeItem(getJWTKey(code));

interface ExperienceProviderProps {
  children: ReactNode;
}

export function ExperienceProvider({ children }: ExperienceProviderProps) {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [experience, setExperience] = useState<Experience | null>(null);
  const [user, setUser] = useState<ExperienceUser | null>(null);
  const [jwt, setJWT] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const [experienceStatus, setExperienceStatus] = useState<'lobby' | 'active' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentCode = code || '';

  const isRegisterRoute = location.pathname.includes('/register');

  // Helper function to make authenticated requests to experience APIs
  const experienceFetch = useCallback(async (url: string, options: RequestInit = {}, providedJwt?: string) => {
    const jwtToUse = providedJwt || jwt;
    if (!jwtToUse) {
      throw new Error('No JWT token available');
    }

    if (!currentCode) {
      throw new Error('No experience code available');
    }

    const headers = {
      'Authorization': `Bearer ${jwtToUse}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401, the JWT is likely expired
    if (response.status === 401) {
      qaLogger(`401 invalid response, clearing current auth navigating to join`)
      clearJWT();
      navigate(`/join?code=${currentCode}`);
      throw new Error('Authentication expired');
    }

    if (!response.ok) {
      qaLogger(`Failed to load experience: ${response}`)
      throw new Error('Failed to load experience');
    }

    return response;
  }, [jwt, currentCode, navigate]);

  const loadExperienceData = useCallback(async (providedJwt?: string) => {
    const jwtToUse = providedJwt || jwt;
    if (!jwtToUse) return;

    try {
      qaLogger(`Fetching experience data`)
      const response = await experienceFetch(`/api/experiences/${encodeURIComponent(currentCode)}`, {}, providedJwt);
      const data = await response.json();

      if (data.success) {
        qaLogger(`Successfully fetched experience, setting context data`)
        setUser(data.user);
        setExperience(data.experience);
        setExperienceStatus(data.experience.status || data.experience.state);
        setError(null);
      } else {
        setError(data.error || 'Failed to load experience');
      }
    } catch (err) {
      // experienceFetch already handles the 401 and clearing JWT
      console.error('Error loading experience:', err);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
      setIsPolling(false);
    }
  }, [jwt, currentCode, experienceFetch]);

  useEffect(() => {
    if (!currentCode) return;

    qaLogger(`Experience code changed to ${currentCode} - resetting context`);

    // Reset state when switching experiences
    setExperience(null);
    setUser(null);
    setError(null);

    const storedJWT = getStoredJWT(currentCode);

    if (storedJWT) {
      qaLogger(`User has previously stored jwt, setting it in context`);
      setJWT(storedJWT);

      // Load experience data immediately if not on register route
      if (!isRegisterRoute) {
        // Use storedJWT directly since state hasn't updated yet
        // This prevents fetching an experience with an invalid token and
        // getting kicked out of the experience.
        //
        // Eg.
        // * visit and register for experience/a -> get token
        // * visit and register for experience/b -> get token
        // * you are no on page experience/b
        // * navgiate to experience/a
        // * this hook picks up the route change via setting a new code and finds
        //   credentials for a. It updates with a setState call. This state
        //   won't reflected in react until the next cycle, so on this current
        //   cycle, a's token will still be used.
        //
        // This isn't a common user flow, but will be a pain for testing the app
        // and sets things up so if it is a flow in the future it is handled
        loadExperienceData(storedJWT);
      }
    } else {
      // No stored JWT
      if (isRegisterRoute) {
        qaLogger("User is on register route, keeping them in the /experience");
        return;
      }

      qaLogger(
        "User has no jwt token and is attempting to access an experience, navigating to join"
      );
      navigate(`/join?code=${currentCode}`);
    }
  }, [currentCode, navigate, isRegisterRoute, loadExperienceData]);

  const setJWTHandler = useCallback((token: string) => {
    if (!currentCode) {
      console.warn('Cannot set JWT without an experience code');
      return;
    }

    setStoredJWT(currentCode, token);
    setJWT(token);
  }, [currentCode]);

  const clearJWT = useCallback(() => {
    if (currentCode) {
      removeStoredJWT(currentCode);
    }
    setJWT(null);
    setExperience(null);
    setUser(null);
    setError(null);
  }, [currentCode]);

  const value: ExperienceContextType = {
    experience,
    user,
    code: currentCode,
    jwt,
    isAuthenticated: jwt !== null && currentCode !== '',
    isLoading,
    isPolling,
    experienceStatus,
    error,
    setJWT: setJWTHandler,
    clearJWT,
    experienceFetch,
  };

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (context === undefined) {
    throw new Error('useExperience must be used within an ExperienceProvider');
  }
  return context;
}
