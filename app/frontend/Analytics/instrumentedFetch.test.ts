import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsEvent } from './events';
import { instrumentedFetch } from './instrumentedFetch';

const { clientMock } = vi.hoisted(() => ({ clientMock: { capture: vi.fn() } }));
vi.mock('./client', () => clientMock);

const URL = '/api/experiences/yay-pie/blocks/abc-123/submit_question_response';

beforeEach(() => {
  clientMock.capture.mockClear();
});

describe('instrumentedFetch', () => {
  it('reports latency and the collapsed path on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));

    await instrumentedFetch(URL, { method: 'POST' }, { source: 'participant' });

    expect(clientMock.capture).toHaveBeenCalledWith(
      AnalyticsEvent.ApiRequestCompleted,
      expect.objectContaining({
        path: '/api/experiences/:code/blocks/:blockId/submit_question_response',
        method: 'POST',
        status: 200,
        source: 'participant',
      }),
    );
    expect(clientMock.capture.mock.calls[0][1].duration_ms).toBeTypeOf('number');
  });

  it('reports a failure event for a non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));

    await instrumentedFetch(URL, {}, { source: 'admin' });

    expect(clientMock.capture).toHaveBeenCalledWith(
      AnalyticsEvent.ApiRequestFailed,
      expect.objectContaining({ status: 500, failure_kind: 'http_status', method: 'GET' }),
    );
  });

  it('reports network errors and rethrows them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(instrumentedFetch(URL, {}, { source: 'public' })).rejects.toThrow('offline');

    expect(clientMock.capture).toHaveBeenCalledWith(
      AnalyticsEvent.ApiRequestFailed,
      expect.objectContaining({ failure_kind: 'network', error_message: 'offline' }),
    );
  });

  it('stays silent on aborts, which are the app cancelling itself', async () => {
    const abort = new DOMException('aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));

    await expect(instrumentedFetch(URL, {}, { source: 'public' })).rejects.toBe(abort);

    expect(clientMock.capture).not.toHaveBeenCalled();
  });
});
