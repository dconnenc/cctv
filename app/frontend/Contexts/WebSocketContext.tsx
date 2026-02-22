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

import {
  FamilyFeudAction,
  FamilyFeudActionType,
} from '@cctv/pages/Block/FamilyFeudManager/familyFeudReducer';
import {
  ExperienceChannelMessage,
  FamilyFeudUpdatedMessage,
  WebSocketMessage,
  WebSocketMessageTypes,
  isDrawingUpdateMessage,
  isExperiencePayloadMessage,
} from '@cctv/types';
import { qaLogger } from '@cctv/utils';

import { useAuth } from './AuthContext';
import { useDispatchRegistry } from './DispatchRegistryContext';
import { useExperienceState } from './ExperienceStateContext';

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15000;

interface WebSocketConfig {
  label: string;
  identifier: Record<string, string>;
  onMessage: (msg: { type?: string; message?: unknown }) => void;
  onConnect?: () => void;
  onError?: () => void;
  onClose?: (event: CloseEvent) => void;
}

interface ManagedWebSocket {
  ws: WebSocket;
  close: () => void;
}

function createWebSocketConnection(
  config: WebSocketConfig,
  onReconnecting?: (reconnecting: boolean) => void,
): ManagedWebSocket {
  let closedIntentionally = false;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let currentWs: WebSocket;

  function connect(): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/cable`;

    qaLogger(`[${config.label}] Connecting: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      qaLogger(`[${config.label}] WebSocket connected`);
      reconnectAttempts = 0;
      onReconnecting?.(false);
      config.onConnect?.();

      const subscription = {
        command: 'subscribe',
        identifier: JSON.stringify(config.identifier),
      };
      ws.send(JSON.stringify(subscription));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      config.onMessage(message);
    };

    ws.onerror = () => {
      qaLogger(`[${config.label}] WebSocket error`);
      config.onError?.();
    };

    ws.onclose = (event) => {
      qaLogger(`[${config.label}] WebSocket closed${event.code ? `. Code: ${event.code}` : ''}`);
      config.onClose?.(event);

      if (!closedIntentionally && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttempts),
          RECONNECT_MAX_DELAY_MS,
        );
        reconnectAttempts++;
        qaLogger(
          `[${config.label}] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
        );
        onReconnecting?.(true);
        reconnectTimer = setTimeout(() => {
          if (!closedIntentionally) {
            currentWs = connect();
          }
        }, delay);
      } else if (!closedIntentionally) {
        qaLogger(`[${config.label}] Max reconnection attempts reached`);
        onReconnecting?.(false);
      }
    };

    return ws;
  }

  currentWs = connect();

  return {
    get ws() {
      return currentWs;
    },
    close() {
      closedIntentionally = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      currentWs.close();
    },
  };
}

function parseChannelMessage(raw: { type?: string; message?: unknown }): WebSocketMessage | null {
  if (raw.type === 'ping' || raw.type === 'welcome') return null;
  if (raw.type === 'confirm_subscription' || raw.type === 'reject_subscription') return null;

  const payload = raw.message ?? raw;
  if (!payload || typeof payload !== 'object') return null;

  const wsMessage = payload as WebSocketMessage;
  if (!wsMessage.type) return null;

  return wsMessage;
}

export interface WebSocketContextType {
  wsConnected: boolean;
  wsError?: string;
  reconnecting: boolean;
  experiencePerform: (
    action: string,
    payload?: Record<string, unknown>,
    target?: 'participant' | 'admin' | 'monitor' | 'impersonation',
  ) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { code, jwt, isManagePage, isMonitorPage } = useAuth();
  const {
    setExperience,
    setParticipant,
    setExperienceStatus,
    setError,
    setMonitorView,
    setParticipantView,
    impersonatedParticipantId,
  } = useExperienceState();
  const { getFamilyFeudDispatch, getLobbyDrawingDispatch } = useDispatchRegistry();

  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string>();
  const [reconnecting, setReconnecting] = useState(false);

  const wsRef = useRef<ManagedWebSocket>(undefined);
  const monitorWsRef = useRef<ManagedWebSocket>(undefined);
  const impersonationWsRef = useRef<ManagedWebSocket>(undefined);
  const wsIdentifierRef = useRef<string>(undefined);
  const monitorIdentifierRef = useRef<string>(undefined);
  const impersonationIdentifierRef = useRef<string>(undefined);

  const reconnectParticipantWs = useCallback(() => {
    if (!wsRef.current || !wsIdentifierRef.current) return;
    qaLogger('[WS] Resubscribe requested — reconnecting participant websocket');
    const identifier = JSON.parse(wsIdentifierRef.current);
    wsRef.current.close();
    wsRef.current = undefined as any;

    const handleMsg = handleExperienceMessageRef.current;
    wsRef.current = createWebSocketConnection(
      {
        label: 'PARTICIPANT WS',
        identifier,
        onMessage: (msg) => handleMsg(msg, 'PARTICIPANT WS', 'main'),
        onConnect: () => {
          setWsConnected(true);
          setWsError(undefined);
        },
        onError: () => {
          setWsError('Connection error');
          setWsConnected(false);
        },
        onClose: () => setWsConnected(false),
      },
      setReconnecting,
    );
  }, []);

  const handleExperienceMessageRef = useRef<typeof handleExperienceMessage>(null as any);

  const handleExperienceMessage = useCallback(
    (
      raw: { type?: string; message?: unknown },
      label: string,
      target: 'main' | 'monitor' | 'impersonation',
    ) => {
      if (raw.type === 'ping' || raw.type === 'welcome') return;

      if (raw.type === 'confirm_subscription') {
        qaLogger(`[${label}] Subscription confirmed`);
        return;
      }
      if (raw.type === 'reject_subscription') {
        qaLogger(`[${label}] SUBSCRIPTION REJECTED - Check backend logs`);
        return;
      }

      if (target === 'monitor') {
        const payload = raw.message ?? raw;
        if (!payload || typeof payload !== 'object') return;
        const channelMsg = payload as ExperienceChannelMessage;

        if (isDrawingUpdateMessage(channelMsg)) {
          const dispatch = getLobbyDrawingDispatch();
          if (dispatch) dispatch(channelMsg);
        } else if (isExperiencePayloadMessage(channelMsg)) {
          qaLogger(`[${label}] Processing: ${channelMsg.type}`);
          if (channelMsg.experience) {
            qaLogger(
              `[${label}] Updating Monitor view: status=${channelMsg.experience.status}, blocks=${channelMsg.experience.blocks?.length || 0}`,
            );
            setMonitorView(channelMsg.experience);
          }
        }
        return;
      }

      const wsMessage = parseChannelMessage(raw);
      if (!wsMessage) return;

      if (wsMessage.type === WebSocketMessageTypes.RESUBSCRIBE_REQUIRED && target === 'main') {
        reconnectParticipantWs();
        return;
      }

      if (isExperiencePayloadMessage(wsMessage)) {
        qaLogger(`[${label}] Processing: ${wsMessage.type}`);
        const updatedExperience = wsMessage.experience;

        if (updatedExperience) {
          qaLogger(
            `[${label}] Updating experience: status=${updatedExperience.status}, blocks=${updatedExperience.blocks?.length || 0}`,
          );

          if (target === 'impersonation') {
            setParticipantView(updatedExperience);
          } else {
            setExperience(updatedExperience);
            setExperienceStatus(updatedExperience.status === 'live' ? 'live' : 'lobby');
            setError(undefined);

            if (wsMessage.participant) {
              setParticipant(wsMessage.participant);
            }
          }
        }
      } else if (
        target === 'main' &&
        wsMessage.type === WebSocketMessageTypes.FAMILY_FEUD_UPDATED
      ) {
        const ffMsg = wsMessage as FamilyFeudUpdatedMessage;
        qaLogger(`[${label}] Processing family_feud_updated: ${ffMsg.operation}`);
        const { block_id, operation, data } = ffMsg;

        const dispatch = getFamilyFeudDispatch(block_id);
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
    },
    [
      setExperience,
      setParticipant,
      setExperienceStatus,
      setError,
      setMonitorView,
      setParticipantView,
      getFamilyFeudDispatch,
      getLobbyDrawingDispatch,
      reconnectParticipantWs,
    ],
  );

  handleExperienceMessageRef.current = handleExperienceMessage;

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
    setReconnecting(false);
  }, []);

  useEffect(() => {
    if (!code) {
      qaLogger('[WS SETUP] No code, disconnecting all websockets');
      disconnectAllWebsockets();
      return;
    }

    if (isManagePage) {
      qaLogger('[WS SETUP] MANAGE PAGE - Creating 3 websockets: Admin, Monitor, Impersonation');

      if (!wsRef.current || wsRef.current.ws.readyState !== WebSocket.OPEN) {
        const adminId = {
          channel: 'ExperienceSubscriptionChannel',
          code,
          ...(jwt ? { token: jwt } : {}),
        };
        wsRef.current = createWebSocketConnection(
          {
            label: 'ADMIN WS',
            identifier: adminId,
            onMessage: (msg) => handleExperienceMessage(msg, 'ADMIN WS', 'main'),
            onConnect: () => {
              setWsConnected(true);
              setWsError(undefined);
            },
            onError: () => {
              setWsError('Connection error');
              setWsConnected(false);
            },
            onClose: () => setWsConnected(false),
          },
          setReconnecting,
        );
        wsIdentifierRef.current = JSON.stringify(adminId);
      }

      if (!monitorWsRef.current || monitorWsRef.current.ws.readyState !== WebSocket.OPEN) {
        const monitorId: Record<string, string> = {
          channel: 'ExperienceSubscriptionChannel',
          code,
          view_type: 'monitor',
        };
        if (jwt) monitorId.token = jwt;
        monitorWsRef.current = createWebSocketConnection({
          label: 'Monitor WS',
          identifier: monitorId,
          onMessage: (msg) => handleExperienceMessage(msg, 'Monitor WS', 'monitor'),
        });
        monitorIdentifierRef.current = JSON.stringify(monitorId);
      }

      if (impersonatedParticipantId) {
        if (impersonationWsRef.current) {
          impersonationWsRef.current.close();
        }
        const impersonationId = {
          channel: 'ExperienceSubscriptionChannel',
          code,
          ...(jwt ? { token: jwt } : {}),
          as_participant_id: impersonatedParticipantId,
        };
        impersonationWsRef.current = createWebSocketConnection({
          label: 'IMPERSONATION WS',
          identifier: impersonationId,
          onMessage: (msg) => handleExperienceMessage(msg, 'IMPERSONATION WS', 'impersonation'),
        });
        impersonationIdentifierRef.current = JSON.stringify(impersonationId);
      } else if (impersonationWsRef.current) {
        qaLogger('[IMPERSONATION WS] Disconnecting');
        impersonationWsRef.current.close();
        impersonationWsRef.current = undefined;
        setParticipantView(undefined);
      }
    } else if (isMonitorPage) {
      qaLogger('[WS SETUP] Monitor PAGE - Creating 1 websocket: Monitor');

      if (!monitorWsRef.current || monitorWsRef.current.ws.readyState !== WebSocket.OPEN) {
        const monitorId: Record<string, string> = {
          channel: 'ExperienceSubscriptionChannel',
          code,
          view_type: 'monitor',
        };
        if (jwt) monitorId.token = jwt;
        monitorWsRef.current = createWebSocketConnection({
          label: 'Monitor WS',
          identifier: monitorId,
          onMessage: (msg) => handleExperienceMessage(msg, 'Monitor WS', 'monitor'),
        });
        monitorIdentifierRef.current = JSON.stringify(monitorId);
      }
    } else {
      qaLogger('[WS SETUP] PARTICIPANT PAGE - Creating 1 websocket: Participant');

      if (jwt) {
        if (!wsRef.current || wsRef.current.ws.readyState !== WebSocket.OPEN) {
          const participantId = { channel: 'ExperienceSubscriptionChannel', code, token: jwt };
          wsRef.current = createWebSocketConnection(
            {
              label: 'PARTICIPANT WS',
              identifier: participantId,
              onMessage: (msg) => handleExperienceMessage(msg, 'PARTICIPANT WS', 'main'),
              onConnect: () => {
                setWsConnected(true);
                setWsError(undefined);
              },
              onError: () => {
                setWsError('Connection error');
                setWsConnected(false);
              },
              onClose: () => setWsConnected(false),
            },
            setReconnecting,
          );
          wsIdentifierRef.current = JSON.stringify(participantId);
        }
      } else {
        qaLogger('[WS SETUP] No JWT available for participant view');
        disconnectAllWebsockets();
      }
    }

    return () => disconnectAllWebsockets();
  }, [
    jwt,
    code,
    isManagePage,
    isMonitorPage,
    impersonatedParticipantId,
    handleExperienceMessage,
    disconnectAllWebsockets,
    setParticipantView,
  ]);

  const experiencePerform = useCallback(
    (
      action: string,
      payload?: Record<string, unknown>,
      target: 'participant' | 'admin' | 'monitor' | 'impersonation' = 'participant',
    ) => {
      const frames = {
        participant: { sock: wsRef.current?.ws, id: wsIdentifierRef.current },
        admin: { sock: wsRef.current?.ws, id: wsIdentifierRef.current },
        monitor: { sock: monitorWsRef.current?.ws, id: monitorIdentifierRef.current },
        impersonation: {
          sock: impersonationWsRef.current?.ws,
          id: impersonationIdentifierRef.current,
        },
      } as const;
      const f = frames[target];
      if (!f.sock || !f.id) return;
      const data = JSON.stringify({ action, ...(payload || {}) });
      f.sock.send(JSON.stringify({ command: 'message', identifier: f.id, data }));
    },
    [],
  );

  const value = useMemo<WebSocketContextType>(
    () => ({ wsConnected, wsError, reconnecting, experiencePerform }),
    [wsConnected, wsError, reconnecting, experiencePerform],
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
