import { type ClientErrorEvent, onClientError } from '@cctv/analytics';
import { FeedbackSource, FeedbackType } from '@cctv/types';

import { createFeedback } from './api';
import { getConsoleLogs } from './consoleBuffer';
import { buildFeedbackContext } from './feedbackContext';
import { redact } from './redact';

export interface PendingErrorReport {
  feedbackId: string;
  message: string;
}

type ErrorListener = (report: PendingErrorReport) => void;

/**
 * A broken render loop fires the same error dozens of times a second. The server
 * deduplicates by fingerprint too, but throttling here keeps a live show from
 * spending its request budget reporting one bug.
 */
const THROTTLE_MS = 5 * 60 * 1000;
const seen = new Map<string, number>();
const listeners = new Set<ErrorListener>();

export function subscribeToErrorReports(listener: ErrorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Files the report immediately rather than waiting on the user, so an error is
 * tracked whether or not anyone chooses to describe it. The prompt that follows
 * only adds detail to a record that already exists.
 */
export async function reportClientError(report: ClientErrorEvent): Promise<void> {
  const message = redact(report.message).slice(0, 500);
  const stack = report.stack ? redact(report.stack).slice(0, 4000) : undefined;
  const fingerprint = fingerprintFor(message, stack);

  const lastSeen = seen.get(fingerprint);
  if (lastSeen !== undefined && Date.now() - lastSeen < THROTTLE_MS) return;
  seen.set(fingerprint, Date.now());

  const result = await createFeedback({
    feedbackType: FeedbackType.BUG,
    source: FeedbackSource.ERROR,
    description: '',
    errorFingerprint: fingerprint,
    consoleLogs: getConsoleLogs(),
    context: buildFeedbackContext({
      error_message: message,
      error_stack: stack,
      error_source: report.source,
      http_status: report.httpStatus,
      http_url: report.httpUrl,
    }),
  });

  if (result.success) {
    listeners.forEach((listener) => listener({ feedbackId: result.feedback.id, message }));
  }
}

export function installGlobalErrorReporting(): void {
  if (!('window' in globalThis)) return;

  // Render crashes and 5xx responses arrive on the analytics error channel.
  onClientError((event) => void reportClientError(event));

  window.addEventListener('error', (event) => {
    if (!event.error && !event.message) return;

    void reportClientError({
      message: event.message || 'Uncaught error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
      source: 'window_error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;

    void reportClientError({
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      source: 'unhandled_rejection',
    });
  });
}

export function resetErrorThrottle(): void {
  seen.clear();
}

/**
 * Groups occurrences of the same defect. The top stack frame is included so two
 * unrelated call sites raising "Cannot read properties of undefined" stay apart.
 */
function fingerprintFor(message: string, stack?: string): string {
  const topFrame = stack?.split('\n').find((line) => line.trim().startsWith('at ')) ?? '';
  return hash(`${message}|${topFrame.trim()}`);
}

function hash(input: string): string {
  let value = 5381;
  for (let i = 0; i < input.length; i += 1) {
    value = ((value << 5) + value + input.charCodeAt(i)) | 0;
  }
  return (value >>> 0).toString(36);
}
