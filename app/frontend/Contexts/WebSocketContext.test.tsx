import { act, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../test-msw';
import { WebSocketProvider, useWebSocket } from './WebSocketContext';

/**
 * jsdom doesn't provide WebSocket, so we stub it globally (see test-setup.ts).
 * This test file overrides that stub with a richer mock that supports triggering
 * open/close/message events, which is necessary for testing reconnection behavior.
 * This is the standard approach — we're filling a missing platform API, not
 * replacing our own code.
 *
 * We stop MSW for this file since MSW's WebSocket interception conflicts with
 * our test-specific WebSocket stub.
 */

let mockWsInstances: TestWebSocket[] = [];

class TestWebSocket extends EventTarget {
  static OPEN = 1;
  static CLOSED = 3;
  static CONNECTING = 0;
  static CLOSING = 2;

  readyState = TestWebSocket.CONNECTING;
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;
  protocol = '';
  extensions = '';
  bufferedAmount = 0;
  binaryType: BinaryType = 'blob';

  constructor(url: string | URL, _protocols?: string | string[]) {
    super();
    this.url = typeof url === 'string' ? url : url.toString();
    mockWsInstances.push(this);
  }

  triggerOpen() {
    this.readyState = TestWebSocket.OPEN;
    this.onopen?.({ type: 'open' } as any);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = TestWebSocket.CLOSED;
  });

  simulateClose(code = 1006) {
    this.readyState = TestWebSocket.CLOSED;
    this.onclose?.({ code } as CloseEvent);
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }
}

vi.stubGlobal('WebSocket', TestWebSocket);

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    code: 'test-code',
    jwt: 'test-jwt',
    isManagePage: false,
    isMonitorPage: false,
  }),
}));

const stableSetExperience = vi.fn();
const stableSetParticipant = vi.fn();
const stableSetExperienceStatus = vi.fn();
const stableSetError = vi.fn();
const stableSetMonitorView = vi.fn();
const stableSetParticipantView = vi.fn();

vi.mock('./ExperienceStateContext', () => ({
  useExperienceState: () => ({
    setExperience: stableSetExperience,
    setParticipant: stableSetParticipant,
    setExperienceStatus: stableSetExperienceStatus,
    setError: stableSetError,
    setMonitorView: stableSetMonitorView,
    setParticipantView: stableSetParticipantView,
    impersonatedParticipantId: null,
  }),
}));

const stableGetFamilyFeudDispatch = vi.fn();
const stableGetLobbyDrawingDispatch = vi.fn();

vi.mock('./DispatchRegistryContext', () => ({
  useDispatchRegistry: () => ({
    getFamilyFeudDispatch: stableGetFamilyFeudDispatch,
    getLobbyDrawingDispatch: stableGetLobbyDrawingDispatch,
  }),
}));

function TestConsumer() {
  const { wsConnected, reconnecting } = useWebSocket();
  return (
    <div>
      <span data-testid="connected">{String(wsConnected)}</span>
      <span data-testid="reconnecting">{String(reconnecting)}</span>
    </div>
  );
}

function getLatestWs(): TestWebSocket {
  return mockWsInstances[mockWsInstances.length - 1];
}

describe('WebSocketContext', () => {
  beforeAll(() => {
    server.close();
    vi.stubGlobal('WebSocket', TestWebSocket);
  });

  afterAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  beforeEach(() => {
    vi.useFakeTimers();
    mockWsInstances = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('connects and sets wsConnected to true', () => {
    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>,
    );

    expect(mockWsInstances.length).toBe(1);

    act(() => {
      getLatestWs().triggerOpen();
    });

    expect(screen.getByTestId('connected').textContent).toBe('true');
  });

  it('triggers auto-reconnect on unintentional close', () => {
    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>,
    );

    act(() => {
      getLatestWs().triggerOpen();
    });

    const instanceCountBefore = mockWsInstances.length;

    act(() => {
      getLatestWs().simulateClose(1006);
    });

    expect(screen.getByTestId('reconnecting').textContent).toBe('true');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockWsInstances.length).toBeGreaterThan(instanceCountBefore);
  });

  it('does not reconnect on intentional close (unmount)', () => {
    const { unmount } = render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>,
    );

    act(() => {
      getLatestWs().triggerOpen();
    });

    const instanceCountBefore = mockWsInstances.length;

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockWsInstances.length).toBe(instanceCountBefore);
  });

  it('handles resubscribe_required by reconnecting', () => {
    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>,
    );

    act(() => {
      getLatestWs().triggerOpen();
    });

    const instanceCountBefore = mockWsInstances.length;

    act(() => {
      getLatestWs().simulateMessage({
        message: { type: 'resubscribe_required' },
      });
    });

    expect(mockWsInstances.length).toBeGreaterThan(instanceCountBefore);
  });
});
