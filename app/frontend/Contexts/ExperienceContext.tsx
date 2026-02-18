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

import { useLocation, useParams } from 'react-router-dom';

import { useUser } from '@cctv/contexts/UserContext';
import {
  FamilyFeudAction,
  FamilyFeudActionType,
} from '@cctv/pages/Block/FamilyFeudManager/familyFeudReducer';
import {
  AuthError,
  DrawingUpdateMessage,
  Experience,
  ExperienceChannelMessage,
  ExperienceContextType,
  ParticipantSummary,
  WebSocketMessage,
  WebSocketMessageTypes,
  isDrawingUpdateMessage,
  isExperiencePayloadMessage,
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
  const wsRef = useRef<WebSocket>(undefined);
  const monitorWsRef = useRef<WebSocket>(undefined);
  const impersonationWsRef = useRef<WebSocket>(undefined);
  const wsIdentifierRef = useRef<string>(undefined);
  const monitorIdentifierRef = useRef<string>(undefined);
  const impersonationIdentifierRef = useRef<string>(undefined);

  // Family Feud dispatch registry (keyed by blockId)
  const familyFeudDispatchRegistry = useRef<Map<string, (action: FamilyFeudAction) => void>>(
    new Map(),
  );
  const lobbyDrawingDispatchRef = useRef<((action: DrawingUpdateMessage) => void) | null>(null);

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
    if (!currentCode) {
      qaLogger('[WS SETUP] No code, disconnecting all websockets');
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
      if (jwt) {
        connectParticipantWebsocket();
      } else {
        qaLogger('[WS SETUP] No JWT available for participant view');
        disconnectAllWebsockets();
      }
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

      const id = JSON.stringify({
        channel: 'ExperienceSubscriptionChannel',
        code: currentCode,
        token: jwt,
      });
      wsIdentifierRef.current = id;
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
      const id = JSON.stringify({
        channel: 'ExperienceSubscriptionChannel',
        code: currentCode,
        token: jwt,
      });
      wsIdentifierRef.current = id;
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

      const identifierObj: any = {
        channel: 'ExperienceSubscriptionChannel',
        code: currentCode,
        view_type: 'monitor',
      };
      if (jwt) identifierObj.token = jwt;

      const subscription = {
        command: 'subscribe',
        identifier: JSON.stringify(identifierObj),
      };

      const id = JSON.stringify(identifierObj);
      monitorIdentifierRef.current = id;
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

        const id = JSON.stringify({
          channel: 'ExperienceSubscriptionChannel',
          code: currentCode,
          token: jwt,
          as_participant_id: participantId,
        });
        impersonationIdentifierRef.current = id;
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

  const handleParticipantMessage = useCallback((message: { type?: string; message?: unknown }) => {
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

    const raw = message.message ?? message;
    if (!raw || typeof raw !== 'object') return;

    const wsMessage = raw as WebSocketMessage;
    if (!wsMessage.type) return;

    if (isExperiencePayloadMessage(wsMessage)) {
      qaLogger(`[PARTICIPANT WS] Processing: ${wsMessage.type}`);
      const updatedExperience = wsMessage.experience;

      if (updatedExperience) {
        qaLogger(
          `[PARTICIPANT WS] Updating experience: status=${updatedExperience.status}, blocks=${updatedExperience.blocks?.length || 0}`,
        );
        setExperience(updatedExperience);
        setExperienceStatus(updatedExperience.status === 'live' ? 'live' : 'lobby');
        setError(undefined);

        if (wsMessage.participant) {
          setParticipant(wsMessage.participant);
        }
      }
    }
  }, []);

  const handleAdminMessage = useCallback((message: { type?: string; message?: unknown }) => {
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

    const raw = message.message ?? message;
    if (!raw || typeof raw !== 'object') return;

    const wsMessage = raw as WebSocketMessage;
    if (!wsMessage.type) return;

    if (isExperiencePayloadMessage(wsMessage)) {
      qaLogger(`[ADMIN WS] Processing: ${wsMessage.type}`);
      const updatedExperience = wsMessage.experience;

      if (updatedExperience) {
        qaLogger(
          `[ADMIN WS] Updating experience: status=${updatedExperience.status}, blocks=${updatedExperience.blocks?.length || 0}`,
        );
        setExperience(updatedExperience);
        setExperienceStatus(updatedExperience.status === 'live' ? 'live' : 'lobby');
        setError(undefined);
      }
    } else if (wsMessage.type === WebSocketMessageTypes.FAMILY_FEUD_UPDATED) {
      const ffMsg = wsMessage;
      qaLogger(`[ADMIN WS] Processing family_feud_updated: ${ffMsg.operation}`);
      const { block_id, operation, data } = ffMsg;

      const dispatch = familyFeudDispatchRegistry.current.get(block_id);
      if (dispatch) {
        const actionTypeMap: Record<string, FamilyFeudActionType> = {
          bucket_added: FamilyFeudActionType.BUCKET_ADDED,
          bucket_renamed: FamilyFeudActionType.BUCKET_RENAMED,
          bucket_deleted: FamilyFeudActionType.BUCKET_DELETED,
          answer_assigned: FamilyFeudActionType.ANSWER_ASSIGNED,
          answer_received: FamilyFeudActionType.ANSWER_RECEIVED,
          question_added: FamilyFeudActionType.QUESTION_ADDED,
          question_deleted: FamilyFeudActionType.QUESTION_DELETED,
        };

        const actionType = actionTypeMap[operation];
        if (actionType) {
          dispatch({ type: actionType, payload: data } as FamilyFeudAction);
        }
      }
    }
  }, []);

  const handleMonitorMessage = useCallback((message: { type?: string; message?: unknown }) => {
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

    const raw = message.message ?? message;
    if (!raw || typeof raw !== 'object') return;

    const channelMsg = raw as ExperienceChannelMessage;

    if (isDrawingUpdateMessage(channelMsg)) {
      const dispatch = lobbyDrawingDispatchRef.current;
      if (dispatch) dispatch(channelMsg);
    } else if (isExperiencePayloadMessage(channelMsg)) {
      qaLogger(`[Monitor WS] Processing: ${channelMsg.type}`);
      const updatedExperience = channelMsg.experience;

      if (updatedExperience) {
        qaLogger(
          `[Monitor WS] Updating Monitor view: status=${updatedExperience.status}, blocks=${updatedExperience.blocks?.length || 0}`,
        );
        setMonitorView(updatedExperience);
      }
    }
  }, []);

  const handleImpersonationMessage = useCallback(
    (message: { type?: string; message?: unknown }) => {
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

      const wsMessage = (message.message ?? message) as WebSocketMessage;
      if (!wsMessage || typeof wsMessage !== 'object') return;

      if (isExperiencePayloadMessage(wsMessage)) {
        qaLogger(`[IMPERSONATION WS] Processing: ${wsMessage.type}`);
        const updatedExperience = wsMessage.experience;

        if (updatedExperience) {
          qaLogger(
            `[IMPERSONATION WS] Updating participant view: status=${updatedExperience.status}, blocks=${updatedExperience.blocks?.length || 0}`,
          );
          setParticipantView(updatedExperience);
        }
      }
    },
    [],
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

  const registerFamilyFeudDispatch = useCallback(
    (blockId: string, dispatch: (action: FamilyFeudAction) => void) => {
      familyFeudDispatchRegistry.current.set(blockId, dispatch);
    },
    [],
  );
  const unregisterFamilyFeudDispatch = useCallback((blockId: string) => {
    familyFeudDispatchRegistry.current.delete(blockId);
  }, []);
  const registerLobbyDrawingDispatch = useCallback(
    (dispatch: (action: DrawingUpdateMessage) => void) => {
      lobbyDrawingDispatchRef.current = dispatch;
    },
    [],
  );
  const unregisterLobbyDrawingDispatch = useCallback(() => {
    lobbyDrawingDispatchRef.current = null;
  }, []);
  const experiencePerform = useCallback(
    (
      action: string,
      payload?: Record<string, unknown>,
      target: 'participant' | 'admin' | 'monitor' | 'impersonation' = 'participant',
    ) => {
      const frames = {
        participant: { sock: wsRef.current, id: wsIdentifierRef.current },
        admin: { sock: wsRef.current, id: wsIdentifierRef.current },
        monitor: { sock: monitorWsRef.current, id: monitorIdentifierRef.current },
        impersonation: {
          sock: impersonationWsRef.current,
          id: impersonationIdentifierRef.current,
        },
      } as const;
      const f = frames[target];
      if (!f.sock || !f.id) return;
      const data = JSON.stringify({ action, ...(payload || {}) });
      const msg: { command: string; identifier: string; data: string } = {
        command: 'message',
        identifier: f.id,
        data,
      };
      f.sock.send(JSON.stringify(msg));
    },
    [],
  );

  const value = useMemo<ExperienceContextType>(
    () => ({
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
      monitorView,
      participantView,
      impersonatedParticipantId,
      setImpersonatedParticipantId,
      registerFamilyFeudDispatch,
      unregisterFamilyFeudDispatch,
      registerLobbyDrawingDispatch,
      unregisterLobbyDrawingDispatch,
      experiencePerform,
    }),
    [
      experience,
      participant,
      currentCode,
      jwt,
      isLoading,
      experienceStatus,
      error,
      setJWTHandler,
      clearJWT,
      experienceFetch,
      wsConnected,
      wsError,
      monitorView,
      participantView,
      impersonatedParticipantId,
      registerFamilyFeudDispatch,
      unregisterFamilyFeudDispatch,
      registerLobbyDrawingDispatch,
      unregisterLobbyDrawingDispatch,
      experiencePerform,
    ],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (context === undefined) {
    throw new Error('useExperience must be used within an ExperienceProvider');
  }
  return context;
}
