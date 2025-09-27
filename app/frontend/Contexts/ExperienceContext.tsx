import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useParams } from 'react-router-dom';

import {
  Experience,
  ExperienceContextType,
  ParticipantSummary,
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketMessageTypes,
} from '@cctv/types';
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

  const [experience, setExperience] = useState<Experience>();
  const [participant, setParticipant] = useState<ParticipantSummary>();
  const [jwt, setJWT] = useState<string>();

  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const [experienceStatus, setExperienceStatus] = useState<'lobby' | 'live'>('lobby');
  const [error, setError] = useState<string>();

  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string>();
  const wsRef = useRef<WebSocket>();

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
        setParticipant(data.participant);
        setExperience(data.experience);

        const incomingStatus: string | undefined = data.experience?.status;
        setExperienceStatus(incomingStatus === 'live' ? 'live' : 'lobby');

        setError(undefined);
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
    setExperience(undefined);
    setParticipant(undefined);
    setError(undefined);

    const stored = getStoredJWT(currentCode);
    if (stored) {
      qaLogger('Found stored JWT; setting in context');
      setJWT(stored);
    } else {
      qaLogger('No stored JWT for this experience');
      setJWT(undefined);
    }
  }, [currentCode]);

  // Whenever we gain a jwt for this code, load fresh experience data
  useEffect(() => {
    // jwt is in the dependency array
    if (currentCode) {
      loadExperienceData();
    }
  }, [jwt, currentCode, loadExperienceData]);

  // WebSocket connection management
  useEffect(() => {
    if (jwt && currentCode) {
      connectToSubscription();
    } else {
      disconnectFromSubscription();
    }

    return () => disconnectFromSubscription();
  }, [jwt, currentCode]);

  const connectToSubscription = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // TODO: Eventually we should only allow secure WebSocket connections (wss://) in production
    // For now, we support both HTTP and HTTPS for development convenience
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/cable`;

    qaLogger(`Connecting to WebSocket subscription: ${wsUrl}`);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      qaLogger('WebSocket connected, subscribing to experience updates');
      setWsConnected(true);
      setWsError(undefined);

      const subscription = {
        command: 'subscribe',
        identifier: JSON.stringify({
          channel: 'ExperienceSubscriptionChannel',
          code: currentCode,
          token: jwt,
        }),
      };

      qaLogger('Sending subscription');
      wsRef.current?.send(JSON.stringify(subscription));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleSubscriptionMessage(message);
    };

    wsRef.current.onerror = () => {
      qaLogger('WebSocket error');
      setWsError('Connection error');
      setWsConnected(false);
    };

    wsRef.current.onclose = () => {
      qaLogger('WebSocket connection closed');
      setWsConnected(false);
    };
  }, [jwt, currentCode]);

  const disconnectFromSubscription = useCallback(() => {
    if (wsRef.current) {
      qaLogger('Disconnecting from WebSocket');
      wsRef.current.close();
      wsRef.current = undefined;
      setWsConnected(false);
      setWsError(undefined);
    }
  }, []);

  const triggerResubscribe = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      qaLogger('Sending resubscribe command to ActionCable');
      wsRef.current.send(
        JSON.stringify({
          command: 'message',
          identifier: JSON.stringify({
            channel: 'ExperienceSubscriptionChannel',
            code: currentCode,
            token: jwt,
          }),
          data: JSON.stringify({ action: 'resubscribe' }),
        }),
      );
    } else {
      qaLogger('WebSocket not open, cannot resubscribe');
    }
  }, [jwt, currentCode]);

  const handleSubscriptionMessage = useCallback(
    (message: any) => {
      // Handle ActionCable internal messages first
      if (message.type === 'welcome') {
        qaLogger('WebSocket connected and welcomed');
        return;
      }

      if (message.type === 'ping') {
        // Silent - these are frequent keep-alive messages
        return;
      }

      if (message.type === 'confirm_subscription') {
        qaLogger('WebSocket subscription confirmed');
        return;
      }

      if (message.type === 'disconnect') {
        qaLogger('WebSocket disconnected by server');
        setWsError('Disconnected by server');
        return;
      }

      // Log for all other message types
      qaLogger('WebSocket message received');

      // Parse the message - ActionCable wraps messages in a message property for broadcasts
      const wsMessage: WebSocketMessage = message.message || message;

      // If there's no type after parsing, this might be an unhandled ActionCable message
      if (!wsMessage || typeof wsMessage !== 'object') {
        return;
      }

      const messageType: WebSocketMessageType = wsMessage.type;

      // If we still don't have a message type, skip silently (likely ActionCable internal message)
      if (!messageType) {
        return;
      }

      // Handle our application-specific messages
      if (messageType === WebSocketMessageTypes.CONFIRM_SUBSCRIPTION) {
        qaLogger('WebSocket subscription confirmed');
        return;
      }

      if (messageType === WebSocketMessageTypes.PING) {
        return;
      }

      // Handle resubscription requests
      if (messageType === WebSocketMessageTypes.RESUBSCRIBE_REQUIRED) {
        qaLogger('Resubscription required, reconnecting');
        triggerResubscribe();
        return;
      }

      // Handle experience-related messages
      if (
        messageType === WebSocketMessageTypes.EXPERIENCE_STATE ||
        messageType === WebSocketMessageTypes.EXPERIENCE_UPDATED ||
        messageType === WebSocketMessageTypes.STREAM_CHANGED
      ) {
        qaLogger(`Experience updated via WebSocket: ${messageType}`);

        // These messages should have experience data
        const experienceMessage = wsMessage as any;
        const updatedExperience = experienceMessage.experience;

        if (updatedExperience) {
          setExperience(updatedExperience);
          setExperienceStatus(updatedExperience.status === 'live' ? 'live' : 'lobby');
          setError(undefined);
        }
      } else {
        qaLogger(`Unknown message type: ${messageType}`);
      }
    },
    [triggerResubscribe],
  );

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
    setJWT(undefined);
    setExperience(undefined);
    setParticipant(undefined);
    setError(undefined);
  }, [currentCode]);

  const value: ExperienceContextType = {
    experience,
    participant,
    code: currentCode,
    jwt,

    isAuthenticated: jwt !== undefined && currentCode !== '',
    isLoading,
    isPolling,
    experienceStatus,
    error,

    setJWT: setJWTHandler,
    clearJWT,
    experienceFetch,

    // WebSocket properties
    wsConnected,
    wsError,
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
