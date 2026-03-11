import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './test-msw';

class MockWebSocket extends EventTarget {
  static OPEN = 1;
  static CLOSED = 3;
  static CONNECTING = 0;
  static CLOSING = 2;

  readyState = MockWebSocket.CONNECTING;
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
  }

  send() {}
  close() {
    this.readyState = MockWebSocket.CLOSED;
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

vi.mock('@cctv/contexts/UserContext', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    isAdmin: false,
    refreshUser: async () => {},
    logOut: async () => true,
  }),
}));
