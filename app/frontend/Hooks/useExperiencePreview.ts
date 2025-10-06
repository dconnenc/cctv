import { useCallback, useEffect, useRef, useState } from 'react';

import { Experience, WebSocketMessage } from '@cctv/types';
import { qaLogger } from '@cctv/utils';

interface UseExperiencePreviewOptions {
  code: string;
  participantId?: string;
  enabled?: boolean;
  jwt?: string;
}

interface PreviewData {
  tvView?: Experience;
  participantView?: Experience;
  allBlocks?: Experience;
}

export function useExperiencePreview({
  code,
  participantId,
  enabled = true,
  jwt,
}: UseExperiencePreviewOptions) {
  const [previewData, setPreviewData] = useState<PreviewData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [isConnected, setIsConnected] = useState(false);

  const tvWsRef = useRef<WebSocket>();
  const participantWsRef = useRef<WebSocket>();

  const loadInitialPreview = useCallback(async () => {
    if (!code || !enabled) return;

    setIsLoading(true);
    setError(undefined);

    try {
      const url = participantId
        ? `/api/experiences/${encodeURIComponent(code)}/preview?participant_id=${participantId}`
        : `/api/experiences/${encodeURIComponent(code)}/preview`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setPreviewData({
          tvView: data.tv_view,
          participantView: data.participant_view,
          allBlocks: data.all_blocks,
        });
      } else {
        setError(data.error || 'Failed to load preview');
      }
    } catch (err) {
      qaLogger(`Error loading preview: ${err}`);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  }, [code, participantId, enabled, jwt]);

  const setupTvWebSocket = useCallback(() => {
    if (!code || !enabled || !jwt) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/cable`;

    const ws = new WebSocket(wsUrl);
    tvWsRef.current = ws;

    ws.onopen = () => {
      qaLogger('[Preview] TV WebSocket connected');
      ws.send(
        JSON.stringify({
          command: 'subscribe',
          identifier: JSON.stringify({
            channel: 'ExperienceSubscriptionChannel',
            code: code,
            token: jwt,
            view_type: 'tv',
          }),
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'ping') return;
        if (data.type === 'welcome') return;
        if (data.type === 'confirm_subscription') {
          qaLogger('[Preview] TV subscription confirmed');
          setIsConnected(true);
          return;
        }

        const message: WebSocketMessage = data.message;
        if (message?.experience) {
          setPreviewData((prev) => ({
            ...prev,
            tvView: message.experience,
          }));
        }
      } catch (err) {
        qaLogger(`[Preview] Error processing TV message: ${err}`);
      }
    };

    ws.onerror = (err) => {
      qaLogger(`[Preview] TV WebSocket error: ${err}`);
      setError('TV view connection error');
    };

    ws.onclose = () => {
      qaLogger('[Preview] TV WebSocket closed');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [code, enabled, jwt]);

  const setupParticipantWebSocket = useCallback(() => {
    if (!code || !participantId || !enabled || !jwt) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/cable`;

    const ws = new WebSocket(wsUrl);
    participantWsRef.current = ws;

    ws.onopen = () => {
      qaLogger('[Preview] Participant WebSocket connected');
      ws.send(
        JSON.stringify({
          command: 'subscribe',
          identifier: JSON.stringify({
            channel: 'ExperienceSubscriptionChannel',
            code: code,
            token: jwt,
            as_participant_id: participantId,
          }),
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'ping') return;
        if (data.type === 'welcome') return;
        if (data.type === 'confirm_subscription') {
          qaLogger('[Preview] Participant subscription confirmed');
          return;
        }

        const message: WebSocketMessage = data.message;
        if (message?.experience) {
          setPreviewData((prev) => ({
            ...prev,
            participantView: message.experience,
          }));
        }
      } catch (err) {
        qaLogger(`[Preview] Error processing participant message: ${err}`);
      }
    };

    ws.onerror = (err) => {
      qaLogger(`[Preview] Participant WebSocket error: ${err}`);
      setError('Participant view connection error');
    };

    ws.onclose = () => {
      qaLogger('[Preview] Participant WebSocket closed');
    };

    return () => {
      ws.close();
    };
  }, [code, participantId, enabled, jwt]);

  useEffect(() => {
    loadInitialPreview();
  }, [loadInitialPreview]);

  useEffect(() => {
    const cleanupTv = setupTvWebSocket();
    const cleanupParticipant = setupParticipantWebSocket();

    return () => {
      cleanupTv?.();
      cleanupParticipant?.();
    };
  }, [setupTvWebSocket, setupParticipantWebSocket]);

  const refresh = useCallback(() => {
    loadInitialPreview();
  }, [loadInitialPreview]);

  return {
    tvView: previewData.tvView,
    participantView: previewData.participantView,
    allBlocks: previewData.allBlocks,
    isLoading,
    isConnected,
    error,
    refresh,
  };
}
