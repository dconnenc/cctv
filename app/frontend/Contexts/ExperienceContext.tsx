import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { Experience, ExperienceContextType, ParticipantSummary } from '@cctv/types';
import { getStoredJWT, qaLogger } from '@cctv/utils';

const ExperienceContext = createContext<ExperienceContextType | undefined>(undefined);

// Helper functions for authenticating users with experiences
// TODO: use id, not code here
const getJWTKey = (code: string) => `experience_jwt_${code}`;
const setStoredJWT = (code: string, jwt: string) => localStorage.setItem(getJWTKey(code), jwt);
const removeStoredJWT = (code: string) => localStorage.removeItem(getJWTKey(code));

interface ExperienceProviderProps {
  children: ReactNode;
}

export function ExperienceProvider({ children }: ExperienceProviderProps) {
  const { code } = useParams<{ code: string }>();

  const [experience, setExperience] = useState<Experience | null>(null);
  const [participant, setParticipant] = useState<ParticipantSummary | null>(null);
  const [jwt, setJWT] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const [experienceStatus, setExperienceStatus] = useState<'lobby' | 'live'>('lobby');
  const [error, setError] = useState<string | null>(null);

  const currentCode = code || '';

  // Helper to make requests with the required credentials
  const experienceFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!currentCode) throw new Error('No experience code available');
      let headers: RequestInit['headers'] = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (jwt) {
        // If a jwt is available, set credentials
        headers = {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
          ...options.headers,
        };
      }

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        qaLogger('401 invalid response; clearing experience JWT');
        if (jwt) {
          // If we get a 401 from a jwt request, it is likely invalid/expired
          clearJWT();
        }
        const err = new Error('Authentication expired');
        (err as any).code = 401;
        throw err;
      }

      if (!response.ok) {
        qaLogger(`Failed experienceFetch: ${response.status}`);
        throw new Error(`Failed to load experience (status ${response.status})`);
      }

      return response;
    },
    [jwt, currentCode],
  );

  const loadExperienceData = useCallback(async () => {
    if (!currentCode) return;

    setIsLoading(true);
    try {
      qaLogger('Fetching experience data');
      const response = await experienceFetch(`/api/experiences/${encodeURIComponent(currentCode)}`);
      const data = await response.json();

      if (data?.type === 'success') {
        qaLogger('Experience fetched; updating context');
        setParticipant(data.participant || null);
        setExperience(data.experience || null);

        const incomingStatus: string | undefined = data.experience?.status;
        setExperienceStatus(incomingStatus === 'live' ? 'live' : 'lobby');

        setError(null);
      } else if (data?.type === 'error') {
        setError(data.error || 'Failed to load experience');
      }
    } catch (err) {
      console.error('Error loading experience:', err);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
      setIsPolling(false);
    }
  }, [jwt, currentCode, experienceFetch]);

  // When the code in the url changes, reset state and hydrate JWT from storage
  useEffect(() => {
    if (!currentCode) return;

    qaLogger(`Experience code changed to ${currentCode} — resetting context`);
    setExperience(null);
    setParticipant(null);
    setError(null);

    const stored = getStoredJWT(currentCode);
    if (stored) {
      qaLogger('Found stored JWT; setting in context');
      setJWT(stored);
    } else {
      qaLogger('No stored JWT for this experience');
      setJWT(null);
    }
  }, [currentCode]);

  // Whenever we gain a jwt for this code, load fresh experience data
  useEffect(() => {
    // jwt is in the dependency array
    if (currentCode) {
      loadExperienceData();
    }
  }, [jwt, currentCode, loadExperienceData]);

  const setJWTHandler = useCallback(
    (token: string) => {
      if (!currentCode) {
        console.warn('Cannot set JWT without an experience code');
        return;
      }
      setStoredJWT(currentCode, token);
      setJWT(token);
    },
    [currentCode],
  );

  const clearJWT = useCallback(() => {
    if (currentCode) removeStoredJWT(currentCode);
    setJWT(null);
    setExperience(null);
    setParticipant(null);
    setError(null);
  }, [currentCode]);

  const value: ExperienceContextType = {
    experience,
    participant,
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
