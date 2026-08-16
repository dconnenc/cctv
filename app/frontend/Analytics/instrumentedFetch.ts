import { capture } from './client';
import { AnalyticsEvent } from './events';
import { apiPathPattern } from './routes';

/**
 * Wraps fetch so every API call reports its latency and, when it fails, why.
 *
 * All three auth paths (public useQuery, participant experienceFetch, admin
 * adminFetch) route through here, which keeps timing definitions identical
 * across them and means new call sites are instrumented by construction.
 *
 * Aborts are deliberately not reported: they are the app cancelling its own
 * in-flight request on rerender, not a user-visible failure.
 */
export async function instrumentedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  context: { source: string },
): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  const path = apiPathPattern(url);
  const method = (init.method ?? 'GET').toUpperCase();
  const startedAt = performance.now();

  try {
    const response = await fetch(input, init);
    const durationMs = Math.round(performance.now() - startedAt);

    capture(response.ok ? AnalyticsEvent.ApiRequestCompleted : AnalyticsEvent.ApiRequestFailed, {
      path,
      method,
      status: response.status,
      duration_ms: durationMs,
      source: context.source,
      ...(response.ok ? {} : { failure_kind: 'http_status' }),
    });

    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;

    capture(AnalyticsEvent.ApiRequestFailed, {
      path,
      method,
      duration_ms: Math.round(performance.now() - startedAt),
      source: context.source,
      failure_kind: 'network',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}
