import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { server } from '../test-msw';
import { clearConsoleBuffer } from './consoleBuffer';
import { reportClientError, resetErrorThrottle, subscribeToErrorReports } from './errorReporter';

interface CapturedRequest {
  feedback: {
    source: string;
    feedback_type: string;
    error_fingerprint: string;
    context: { error_message?: string; error_source?: string };
  };
}

let requests: CapturedRequest[] = [];
let unsubscribe: (() => void) | undefined;

beforeEach(() => {
  requests = [];
  resetErrorThrottle();
  clearConsoleBuffer();

  server.use(
    http.post<never, CapturedRequest>('/api/feedbacks', async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json(
        { success: true, feedback: { id: `feedback-${requests.length}` } },
        { status: 201 },
      );
    }),
  );
});

afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
});

describe('reportClientError', () => {
  it('files the report immediately, without waiting on the user', async () => {
    await reportClientError({
      message: 'Cannot read properties of undefined',
      stack: 'Error: boom\n    at Poll (Poll.tsx:12:4)',
      source: 'react_error_boundary',
    });

    expect(requests).toHaveLength(1);
    expect(requests[0].feedback).toMatchObject({
      source: 'error',
      feedback_type: 'bug',
    });
    expect(requests[0].feedback.context.error_message).toBe('Cannot read properties of undefined');
  });

  it('notifies subscribers so the prompt can offer to collect detail', async () => {
    const seen: string[] = [];
    unsubscribe = subscribeToErrorReports((report) => seen.push(report.feedbackId));

    await reportClientError({ message: 'boom', source: 'window_error' });

    expect(seen).toEqual(['feedback-1']);
  });

  it('throttles a repeating error so one render loop does not flood the API', async () => {
    const report = {
      message: 'Cannot read properties of undefined',
      stack: 'Error: boom\n    at Poll (Poll.tsx:12:4)',
      source: 'react_error_boundary' as const,
    };

    await reportClientError(report);
    await reportClientError(report);
    await reportClientError(report);

    expect(requests).toHaveLength(1);
  });

  it('keeps errors from different call sites apart', async () => {
    await reportClientError({
      message: 'Cannot read properties of undefined',
      stack: 'Error\n    at Poll (Poll.tsx:12:4)',
      source: 'react_error_boundary',
    });
    await reportClientError({
      message: 'Cannot read properties of undefined',
      stack: 'Error\n    at Buzzer (Buzzer.tsx:40:2)',
      source: 'react_error_boundary',
    });

    expect(requests).toHaveLength(2);
    expect(requests[0].feedback.error_fingerprint).not.toBe(requests[1].feedback.error_fingerprint);
  });

  it('redacts credentials out of the error message before sending', async () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.s1gnatur3';

    await reportClientError({ message: `request failed with ${jwt}`, source: 'window_error' });

    expect(requests[0].feedback.context.error_message).not.toContain(jwt);
  });

  it('records which subsystem reported the error', async () => {
    await reportClientError({
      message: 'POST /api/x failed with 500',
      source: 'api_server_error',
      httpStatus: 500,
      httpUrl: '/api/x',
    });

    expect(requests[0].feedback.context.error_source).toBe('api_server_error');
  });
});
