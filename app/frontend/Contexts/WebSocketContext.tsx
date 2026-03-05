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

import { useExperienceRoute } from '@cctv/hooks/useExperienceRoute';
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

import { useAdminAuth } from './AdminAuthContext';
import { useAuth } from './AuthContext';
import { useDispatchRegistry } from './DispatchRegistryContext';
import { useExperienceState } from './ExperienceStateContext';
import { DrawingAction, useLobbyDrawingDispatch } from './LobbyDrawingContext';

const ACTION_TYPE_MAP: Record<string, FamilyFeudActionType> = {
  bucket_added: FamilyFeudActionType.BUCKET_ADDED,
  bucket_renamed: FamilyFeudActionType.BUCKET_RENAMED,
  bucket_deleted: FamilyFeudActionType.BUCKET_DELETED,
  answer_assigned: FamilyFeudActionType.ANSWER_ASSIGNED,
  answer_received: FamilyFeudActionType.ANSWER_RECEIVED,
  question_added: FamilyFeudActionType.QUESTION_ADDED,
  question_deleted: FamilyFeudActionType.QUESTION_DELETED,
};

interface WebSocketConfig {
  label: string;
  identifier: Record<string, string>;
  onMessage: (msg: { type?: string; message?: unknown }) => void;
  onConnect?: () => void;
  onError?: () => void;
  onClose?: (event: CloseEvent) => void;
}

function createWebSocketConnection(
  config: WebSocketConfig,
  wsRef: { current: WebSocket | undefined },
  identifierRef: { current: string | undefined },
  disposeRef: { current: boolean },
  attempt = 0,
): void {
  if (disposeRef.current) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/cable`;

  qaLogger(
    `[${config.label}] Connecting: ${wsUrl}${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}`,
  );
  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;
  identifierRef.current = JSON.stringify(config.identifier);

  let rejected = false;

  ws.onopen = () => {
    qaLogger(`[${config.label}] WebSocket connected`);
    config.onConnect?.();

    ws.send(
      JSON.stringify({
        command: 'subscribe',
        identifier: JSON.stringify(config.identifier),
      }),
    );
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'reject_subscription') rejected = true;
    config.onMessage(message);
  };

  ws.onerror = () => {
    qaLogger(`[${config.label}] WebSocket error`);
    config.onError?.();
  };

  ws.onclose = (event) => {
    qaLogger(`[${config.label}] WebSocket closed${event.code ? `. Code: ${event.code}` : ''}`);
    config.onClose?.(event);

    if (!disposeRef.current && !rejected && event.code !== 1000 && event.code !== 1001) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      qaLogger(`[${config.label}] Reconnecting in ${delay}ms (attempt ${attempt + 1})`);
      setTimeout(
        () => createWebSocketConnection(config, wsRef, identifierRef, disposeRef, attempt + 1),
        delay,
      );
    }
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
  experiencePerform: (
    action: string,
    payload?: Record<string, unknown>,
    target?: 'primary' | 'monitor' | 'impersonation',
  ) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { code, isManagePage, isMonitorPage } = useExperienceRoute();
  const { jwt, isLoading } = useAuth();
  const { adminJWT, isAdminLoading } = useAdminAuth();
  const {
    setExperience,
    setParticipant,
    setExperienceStatus,
    setError,
    setMonitorView,
    setParticipantView,
    setWsReady,
    impersonatedParticipantId,
  } = useExperienceState();
  const { getFamilyFeudDispatch } = useDispatchRegistry();
  const lobbyDrawingDispatch = useLobbyDrawingDispatch();

  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string>();

  const wsRef = useRef<WebSocket>(undefined);
  const monitorWsRef = useRef<WebSocket>(undefined);
  const impersonationWsRef = useRef<WebSocket>(undefined);
  const wsIdentifierRef = useRef<string>(undefined);
  const monitorIdentifierRef = useRef<string>(undefined);
  const impersonationIdentifierRef = useRef<string>(undefined);

  const mainDisposeRef = useRef(false);
  const monitorDisposeRef = useRef(false);
  const impersonationDisposeRef = useRef(false);

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
        const wsMessage = parseChannelMessage(raw);
        if (!wsMessage) return;

        const channelMsg = wsMessage as ExperienceChannelMessage;

        if (isDrawingUpdateMessage(channelMsg)) {
          lobbyDrawingDispatch({
            type: 'drawing_update',
            participant_id: channelMsg.participant_id,
            operation: channelMsg.operation,
            data: channelMsg.data,
          } as DrawingAction);
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
            setWsReady(true);

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
          const actionType = ACTION_TYPE_MAP[operation];
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
      setWsReady,
      getFamilyFeudDispatch,
      lobbyDrawingDispatch,
    ],
  );

  const handleMessageRef = useRef(handleExperienceMessage);
  useEffect(() => {
    handleMessageRef.current = handleExperienceMessage;
  });

  // Main effect: manages admin, monitor, and participant connections.
  // Does not depend on impersonatedParticipantId so impersonation changes
  // don't tear down and rebuild the stable connections.
  useEffect(() => {
    if (!code || isLoading || (isManagePage && isAdminLoading)) {
      qaLogger('[WS SETUP] No code or auth loading, skipping websocket setup');
      return;
    }

    mainDisposeRef.current = false;
    monitorDisposeRef.current = false;

    if (isManagePage) {
      qaLogger('[WS SETUP] MANAGE PAGE - Creating admin and monitor websockets');

      createWebSocketConnection(
        {
          label: 'ADMIN WS',
          identifier: {
            channel: 'ExperienceSubscriptionChannel',
            code,
            ...((adminJWT ?? jwt) ? { token: adminJWT ?? jwt } : {}),
          },
          onMessage: (msg) => handleMessageRef.current(msg, 'ADMIN WS', 'main'),
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
        wsRef,
        wsIdentifierRef,
        mainDisposeRef,
      );

      const monitorId: Record<string, string> = {
        channel: 'ExperienceSubscriptionChannel',
        code,
        view_type: 'monitor',
      };
      createWebSocketConnection(
        {
          label: 'Monitor WS',
          identifier: monitorId,
          onMessage: (msg) => handleMessageRef.current(msg, 'Monitor WS', 'monitor'),
        },
        monitorWsRef,
        monitorIdentifierRef,
        monitorDisposeRef,
      );
    } else if (isMonitorPage) {
      qaLogger('[WS SETUP] MONITOR PAGE - Creating monitor websocket');

      const monitorId: Record<string, string> = {
        channel: 'ExperienceSubscriptionChannel',
        code,
        view_type: 'monitor',
      };
      createWebSocketConnection(
        {
          label: 'Monitor WS',
          identifier: monitorId,
          onMessage: (msg) => handleMessageRef.current(msg, 'Monitor WS', 'monitor'),
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
        monitorWsRef,
        monitorIdentifierRef,
        monitorDisposeRef,
      );
    } else {
      qaLogger('[WS SETUP] PARTICIPANT PAGE - Creating participant websocket');

      if (jwt) {
        const participantId = { channel: 'ExperienceSubscriptionChannel', code, token: jwt };
        createWebSocketConnection(
          {
            label: 'PARTICIPANT WS',
            identifier: participantId,
            onMessage: (msg) => handleMessageRef.current(msg, 'PARTICIPANT WS', 'main'),
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
          wsRef,
          wsIdentifierRef,
          mainDisposeRef,
        );
      }
    }

    return () => {
      mainDisposeRef.current = true;
      monitorDisposeRef.current = true;

      if (wsRef.current) {
        qaLogger('[WS] Disconnecting main WebSocket');
        wsRef.current.close(1000);
        wsRef.current = undefined;
      }
      if (monitorWsRef.current) {
        qaLogger('[WS] Disconnecting monitor WebSocket');
        monitorWsRef.current.close(1000);
        monitorWsRef.current = undefined;
      }

      setWsConnected(false);
      setWsError(undefined);
      setWsReady(false);
    };
  }, [adminJWT, jwt, code, isLoading, isAdminLoading, isManagePage, isMonitorPage, setWsReady]);

  // Impersonation effect: manages the impersonation connection independently.
  // Changing the impersonated participant only affects this connection.
  useEffect(() => {
    if (!code || isLoading || !isManagePage) return;

    if (impersonatedParticipantId) {
      qaLogger(`[IMPERSONATION WS] Connecting for participant ${impersonatedParticipantId}`);
      impersonationDisposeRef.current = false;

      if (impersonationWsRef.current) {
        impersonationWsRef.current.close(1000);
      }

      const impersonationId = {
        channel: 'ExperienceSubscriptionChannel',
        code,
        ...((adminJWT ?? jwt) ? { token: adminJWT ?? jwt } : {}),
        as_participant_id: impersonatedParticipantId,
      };
      createWebSocketConnection(
        {
          label: 'IMPERSONATION WS',
          identifier: impersonationId,
          onMessage: (msg) => handleMessageRef.current(msg, 'IMPERSONATION WS', 'impersonation'),
        },
        impersonationWsRef,
        impersonationIdentifierRef,
        impersonationDisposeRef,
      );
    }

    return () => {
      impersonationDisposeRef.current = true;
      if (impersonationWsRef.current) {
        qaLogger('[IMPERSONATION WS] Disconnecting');
        impersonationWsRef.current.close(1000);
        impersonationWsRef.current = undefined;
        impersonationIdentifierRef.current = undefined;
      }
      setParticipantView(undefined);
    };
  }, [adminJWT, jwt, code, isLoading, isManagePage, impersonatedParticipantId, setParticipantView]);

  const experiencePerform = useCallback(
    (
      action: string,
      payload?: Record<string, unknown>,
      target: 'primary' | 'monitor' | 'impersonation' = 'primary',
    ) => {
      const frames = {
        primary: { sock: wsRef.current, id: wsIdentifierRef.current },
        monitor: { sock: monitorWsRef.current, id: monitorIdentifierRef.current },
        impersonation: { sock: impersonationWsRef.current, id: impersonationIdentifierRef.current },
      } as const;
      const f = frames[target];
      if (!f.sock || !f.id) return;
      const data = JSON.stringify({ action, ...(payload || {}) });
      f.sock.send(JSON.stringify({ command: 'message', identifier: f.id, data }));
    },
    [],
  );

  const value = useMemo<WebSocketContextType>(
    () => ({ wsConnected, wsError, experiencePerform }),
    [wsConnected, wsError, experiencePerform],
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
