import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useLocation, useParams } from 'react-router-dom';

import { useUser } from '@cctv/contexts';
import {
  Experience,
  ExperienceContextType,
  ParticipantSummary,
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketMessageTypes,
} from '@cctv/types';
import {
  getJWTKey,
  getStoredAdminJWT,
  getStoredJWT,
  qaLogger,
  removeStoredAdminJWT,
  setStoredAdminJWT,
} from '@cctv/utils';

const ExperienceContext = createContext<ExperienceContextType | undefined>(undefined);

const setStoredJWT = (code: string, jwt: string) => localStorage.setItem(getJWTKey(code), jwt);
const removeStoredJWT = (code: string) => localStorage.removeItem(getJWTKey(code));

interface ExperienceProviderProps {
  children: ReactNode;
}

export function ExperienceProvider({ children }: ExperienceProviderProps) {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const { isAdmin } = useUser();

  const [experience, setExperience] = useState<Experience>();
  const [participant, setParticipant] = useState<ParticipantSummary>();
  const [jwt, setJWT] = useState<string>();

  const [isLoading, setIsLoading] = useState(false);
  const [experienceStatus, setExperienceStatus] = useState<'lobby' | 'live'>('lobby');
  const [error, setError] = useState<string>();

  // Manage page specific state
  const [monitorView, setMonitorView] = useState<Experience>();
  const [participantView, setParticipantView] = useState<Experience>();
  const [impersonatedParticipantId, setImpersonatedParticipantId] = useState<string>();

  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string>();
  const wsRef = useRef<WebSocket>();
  const monitorWsRef = useRef<WebSocket>();
  const impersonationWsRef = useRef<WebSocket>();

  const currentCode = code || '';
  const isManagePage = location.pathname.includes('/manage');
  const isMonitorPage = location.pathname.includes('/monitor');

  // Helper to make requests with credentials
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

        if (jwt) {
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

  // Fetch admin JWT from the API
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

      if (!response.ok) {
        throw new Error('Failed to fetch admin JWT');
      }

      const data = await response.json();

      if (data?.success && data?.jwt) {
        qaLogger('Admin JWT received');
        setStoredAdminJWT(currentCode, data.jwt);
        setJWT(data.jwt);
      } else {
        throw new Error('Invalid admin JWT response');
      }
    } catch (err) {
      console.error('Error fetching admin JWT:', err);
      setError('Failed to authenticate as admin');
    }
  }, [currentCode, isAdmin]);

  // Load JWT when code changes
  useEffect(() => {
    if (!currentCode) return;

    qaLogger(`Experience code changed to ${currentCode} — resetting context`);
    setExperience(undefined);
    setParticipant(undefined);
    setMonitorView(undefined);
    setParticipantView(undefined);
    setError(undefined);
    setIsLoading(true);

    if ((isManagePage || isMonitorPage) && isAdmin) {
      // Admin on manage or Monitor page: try to load or fetch admin JWT
      const storedAdminJWT = getStoredAdminJWT(currentCode);
      if (storedAdminJWT) {
        qaLogger('Found stored admin JWT; setting in context');
        setJWT(storedAdminJWT);
        setIsLoading(false);
      } else {
        qaLogger('No stored admin JWT; fetching from API');
        fetchAdminJWT().finally(() => setIsLoading(false));
      }
    } else {
      // Participant page: load participant JWT
      const storedJWT = getStoredJWT(currentCode);
      if (storedJWT) {
        qaLogger('Found stored participant JWT; setting in context');
        setJWT(storedJWT);
      } else {
        qaLogger('No stored participant JWT');
        setJWT(undefined);
      }
      setIsLoading(false);
    }
  }, [currentCode, isManagePage, isMonitorPage, isAdmin, fetchAdminJWT]);

  // WebSocket connection management
  useEffect(() => {
    if (!jwt || !currentCode) {
      qaLogger('[WS SETUP] No JWT or code, disconnecting all websockets');
      disconnectAllWebsockets();
      return;
    }

    if (isManagePage) {
      qaLogger('[WS SETUP] MANAGE PAGE - Creating 3 websockets: Admin, Monitor, Impersonation');
      // Manage page: connect to admin, Monitor, and impersonation websockets
      connectAdminWebsocket();
      connectMonitorWebsocket();

      // Connect impersonation if participant selected
      if (impersonatedParticipantId) {
        connectImpersonationWebsocket(impersonatedParticipantId);
      } else {
        disconnectImpersonationWebsocket();
      }
    } else if (isMonitorPage) {
      qaLogger('[WS SETUP] Monitor PAGE - Creating 1 websocket: Monitor');
      // Monitor page: single Monitor websocket
      connectMonitorWebsocket();
    } else {
      qaLogger('[WS SETUP] PARTICIPANT PAGE - Creating 1 websocket: Participant');
      // Regular participant page: single websocket
      connectParticipantWebsocket();
    }

    return () => disconnectAllWebsockets();
  }, [jwt, currentCode, isManagePage, isMonitorPage, impersonatedParticipantId]);

  const connectParticipantWebsocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/cable`;

    qaLogger(`[PARTICIPANT WS] Connecting: ${wsUrl}`);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      qaLogger('[PARTICIPANT WS] WebSocket connected');
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

      wsRef.current?.send(JSON.stringify(subscription));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleParticipantMessage(message);
    };

    wsRef.current.onerror = () => {
      qaLogger('[PARTICIPANT WS] WebSocket error');
      setWsError('Connection error');
      setWsConnected(false);
    };

    wsRef.current.onclose = () => {
      qaLogger('[PARTICIPANT WS] WebSocket closed');
      setWsConnected(false);
    };
  }, [jwt, currentCode]);

  const connectAdminWebsocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/cable`;

    qaLogger(`[ADMIN WS] Connecting: ${wsUrl}`);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      qaLogger('[ADMIN WS] WebSocket connected');
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

      qaLogger('[ADMIN WS] Sending subscription');
      wsRef.current?.send(JSON.stringify(subscription));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleAdminMessage(message);
    };

    wsRef.current.onerror = () => {
      qaLogger('[ADMIN WS] WebSocket error');
      setWsError('Connection error');
      setWsConnected(false);
    };

    wsRef.current.onclose = (event) => {
      qaLogger(`[ADMIN WS] WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
      setWsConnected(false);
    };
  }, [jwt, currentCode]);

  const connectMonitorWebsocket = useCallback(() => {
    if (monitorWsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/cable`;

    qaLogger(`[Monitor WS] Connecting: ${wsUrl}`);
    monitorWsRef.current = new WebSocket(wsUrl);

    monitorWsRef.current.onopen = () => {
      qaLogger('[Monitor WS] WebSocket connected');

      const subscription = {
        command: 'subscribe',
        identifier: JSON.stringify({
          channel: 'ExperienceSubscriptionChannel',
          code: currentCode,
          token: jwt,
          view_type: 'monitor',
        }),
      };

      monitorWsRef.current?.send(JSON.stringify(subscription));
    };

    monitorWsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleMonitorMessage(message);
    };

    monitorWsRef.current.onerror = () => {
      qaLogger('[Monitor WS] WebSocket error');
    };

    monitorWsRef.current.onclose = () => {
      qaLogger('[Monitor WS] WebSocket closed');
    };
  }, [jwt, currentCode]);

  const connectImpersonationWebsocket = useCallback(
    (participantId: string) => {
      if (impersonationWsRef.current?.readyState === WebSocket.OPEN) {
        impersonationWsRef.current.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/cable`;

      qaLogger(`[IMPERSONATION WS] Connecting for participant ${participantId}`);
      impersonationWsRef.current = new WebSocket(wsUrl);

      impersonationWsRef.current.onopen = () => {
        qaLogger('[IMPERSONATION WS] WebSocket connected');

        const subscription = {
          command: 'subscribe',
          identifier: JSON.stringify({
            channel: 'ExperienceSubscriptionChannel',
            code: currentCode,
            token: jwt,
            as_participant_id: participantId,
          }),
        };

        impersonationWsRef.current?.send(JSON.stringify(subscription));
      };

      impersonationWsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleImpersonationMessage(message);
      };

      impersonationWsRef.current.onerror = () => {
        qaLogger('[IMPERSONATION WS] WebSocket error');
      };

      impersonationWsRef.current.onclose = () => {
        qaLogger('[IMPERSONATION WS] WebSocket closed');
      };
    },
    [jwt, currentCode],
  );

  const disconnectImpersonationWebsocket = useCallback(() => {
    if (impersonationWsRef.current) {
      qaLogger('[IMPERSONATION WS] Disconnecting');
      impersonationWsRef.current.close();
      impersonationWsRef.current = undefined;
      setParticipantView(undefined);
    }
  }, []);

  const disconnectAllWebsockets = useCallback(() => {
    if (wsRef.current) {
      qaLogger('[WS] Disconnecting main WebSocket');
      wsRef.current.close();
      wsRef.current = undefined;
    }
    if (monitorWsRef.current) {
      qaLogger('[WS] Disconnecting monitor WebSocket');
      monitorWsRef.current.close();
      monitorWsRef.current = undefined;
    }
    if (impersonationWsRef.current) {
      qaLogger('[WS] Disconnecting impersonation WebSocket');
      impersonationWsRef.current.close();
      impersonationWsRef.current = undefined;
    }
    setWsConnected(false);
    setWsError(undefined);
  }, []);

  const handleParticipantMessage = useCallback((message: any) => {
    if (message.type === 'ping') return;

    if (message.type === 'welcome') return;

    if (message.type === 'confirm_subscription') {
      qaLogger('[PARTICIPANT WS] Subscription confirmed');
      return;
    }

    if (message.type === 'reject_subscription') {
      qaLogger('[PARTICIPANT WS] SUBSCRIPTION REJECTED - Check backend logs');
      return;
    }

    const wsMessage: WebSocketMessage = message.message || message;
    if (!wsMessage || typeof wsMessage !== 'object') {
      return;
    }

    const messageType: WebSocketMessageType = wsMessage.type;
    if (!messageType) {
      return;
    }

    if (
      messageType === WebSocketMessageTypes.EXPERIENCE_STATE ||
      messageType === WebSocketMessageTypes.EXPERIENCE_UPDATED ||
      messageType === WebSocketMessageTypes.STREAM_CHANGED
    ) {
      qaLogger(`[PARTICIPANT WS] Processing: ${messageType}`);
      const experienceMessage = wsMessage as any;
      const updatedExperience = experienceMessage.experience;

      if (updatedExperience) {
        qaLogger(
          `[PARTICIPANT WS] Updating experience: status=${updatedExperience.status}, blocks=${updatedExperience.blocks?.length || 0}`,
        );
        setExperience(updatedExperience);
        setExperienceStatus(updatedExperience.status === 'live' ? 'live' : 'lobby');
        setError(undefined);

        // Set participant from message
        if (experienceMessage.participant) {
          setParticipant(experienceMessage.participant);
        }
      }
    }
  }, []);

  const handleAdminMessage = useCallback((message: any) => {
    if (message.type === 'ping') return;

    if (message.type === 'welcome') return;

    if (message.type === 'confirm_subscription') {
      qaLogger('[ADMIN WS] Subscription confirmed');
      return;
    }

    if (message.type === 'reject_subscription') {
      qaLogger('[ADMIN WS] SUBSCRIPTION REJECTED - Check backend logs');
      return;
    }

    const wsMessage: WebSocketMessage = message.message || message;
    if (!wsMessage || typeof wsMessage !== 'object') {
      return;
    }

    const messageType: WebSocketMessageType = wsMessage.type;
    if (!messageType) {
      return;
    }

    if (
      messageType === WebSocketMessageTypes.EXPERIENCE_STATE ||
      messageType === WebSocketMessageTypes.EXPERIENCE_UPDATED ||
      messageType === WebSocketMessageTypes.STREAM_CHANGED
    ) {
      qaLogger(`[ADMIN WS] Processing: ${messageType}`);
      const experienceMessage = wsMessage as any;
      const updatedExperience = experienceMessage.experience;

      if (updatedExperience) {
        qaLogger(
          `[PARTICIPANT WS] Updating experience: status=${updatedExperience.status}, blocks=${updatedExperience.blocks?.length || 0}`,
        );
        setExperience(updatedExperience);
        setExperienceStatus(updatedExperience.status === 'live' ? 'live' : 'lobby');
        setError(undefined);
      }
    }
  }, []);

  const handleMonitorMessage = useCallback((message: any) => {
    if (message.type === 'ping') return;

    if (message.type === 'welcome') return;

    if (message.type === 'confirm_subscription') {
      qaLogger('[Monitor WS] Subscription confirmed');
      return;
    }

    if (message.type === 'reject_subscription') {
      qaLogger('[Monitor WS] SUBSCRIPTION REJECTED - Check backend logs');
      return;
    }

    const wsMessage: WebSocketMessage = message.message || message;
    if (!wsMessage || typeof wsMessage !== 'object') {
      return;
    }

    const messageType: WebSocketMessageType = wsMessage.type;
    if (!messageType) {
      return;
    }

    if (
      messageType === WebSocketMessageTypes.EXPERIENCE_STATE ||
      messageType === WebSocketMessageTypes.EXPERIENCE_UPDATED ||
      messageType === WebSocketMessageTypes.STREAM_CHANGED
    ) {
      qaLogger(`[Monitor WS] Processing: ${messageType}`);
      const experienceMessage = wsMessage as any;
      const updatedExperience = experienceMessage.experience;

      if (updatedExperience) {
        qaLogger(
          `[Monitor WS] Updating Monitor view: status=${updatedExperience.status}, blocks=${updatedExperience.blocks?.length || 0}`,
        );
        setMonitorView(updatedExperience);
      }
    }
  }, []);

  const handleImpersonationMessage = useCallback((message: any) => {
    if (message.type === 'ping') return;

    if (message.type === 'welcome') return;

    if (message.type === 'confirm_subscription') {
      qaLogger('[IMPERSONATION WS] Subscription confirmed');
      return;
    }

    if (message.type === 'reject_subscription') {
      qaLogger('[IMPERSONATION WS] SUBSCRIPTION REJECTED - Check backend logs');
      return;
    }

    const wsMessage: WebSocketMessage = message.message || message;
    if (!wsMessage || typeof wsMessage !== 'object') {
      return;
    }

    const messageType: WebSocketMessageType = wsMessage.type;
    if (!messageType) {
      return;
    }

    if (
      messageType === WebSocketMessageTypes.EXPERIENCE_STATE ||
      messageType === WebSocketMessageTypes.EXPERIENCE_UPDATED ||
      messageType === WebSocketMessageTypes.STREAM_CHANGED
    ) {
      qaLogger(`[IMPERSONATION WS] Processing: ${messageType}`);
      const experienceMessage = wsMessage as any;
      const updatedExperience = experienceMessage.experience;

      if (updatedExperience) {
        qaLogger(
          `[IMPERSONATION WS] Updating participant view: status=${updatedExperience.status}, blocks=${updatedExperience.blocks?.length || 0}`,
        );
        setParticipantView(updatedExperience);
      }
    }
  }, []);

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
    if (currentCode) {
      removeStoredJWT(currentCode);
      removeStoredAdminJWT(currentCode);
    }
    setJWT(undefined);
    setExperience(undefined);
    setParticipant(undefined);
    setMonitorView(undefined);
    setParticipantView(undefined);
    setError(undefined);
  }, [currentCode]);

  const value: ExperienceContextType = {
    experience,
    participant,
    code: currentCode,
    jwt,

    isAuthenticated: jwt !== undefined && currentCode !== '',
    isLoading,
    experienceStatus,
    error,

    setJWT: setJWTHandler,
    clearJWT,
    experienceFetch,

    wsConnected,
    wsError,

    // Manage page specific
    monitorView,
    participantView,
    impersonatedParticipantId,
    setImpersonatedParticipantId,
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
