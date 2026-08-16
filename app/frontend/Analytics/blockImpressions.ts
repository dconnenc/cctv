import { capture } from './client';
import { AnalyticsEvent } from './events';

/**
 * Records when each block first became visible to this participant, so a submit
 * can report how long the prompt sat on screen before they answered.
 *
 * The server cannot answer these questions: it sees the host open a block and it
 * sees submissions arrive, but never learns who was actually looking at the block
 * and chose not to respond. `block seen` supplies that missing denominator —
 * without it, "how many people didn't submit" and "how many never even opened the
 * question" are both unanswerable.
 *
 * Kept in module scope rather than React state so the timestamp survives the
 * remounts that happen as websocket payloads replace the block tree.
 */
const seenAt = new Map<string, number>();

export function trackBlockSeen(properties: {
  blockId: string;
  blockKind: string;
  experienceCode?: string;
}): void {
  if (seenAt.has(properties.blockId)) return;

  seenAt.set(properties.blockId, performance.now());
  capture(AnalyticsEvent.BlockSeen, {
    block_id: properties.blockId,
    block_kind: properties.blockKind,
    experience_code: properties.experienceCode,
  });
}

/**
 * Milliseconds the block had been on screen, or undefined when it was never
 * recorded as seen (a submit from a view that does not track impressions).
 */
export function millisecondsSinceSeen(blockId: string): number | undefined {
  const start = seenAt.get(blockId);
  return start === undefined ? undefined : Math.round(performance.now() - start);
}

export function resetBlockImpressions(): void {
  seenAt.clear();
}

/**
 * Client-side companion to the server's `response submitted`. The server records
 * the authoritative submission; this one carries the time the participant spent
 * on the prompt, which only the client can know.
 */
export function trackSubmissionSucceeded(blockId: string, responseKind: string): void {
  capture(AnalyticsEvent.ResponseSubmitted, {
    block_id: blockId,
    response_kind: responseKind,
    milliseconds_since_seen: millisecondsSinceSeen(blockId),
  });
}

export function trackSubmissionFailed(
  blockId: string,
  responseKind: string,
  failureKind: 'rejected' | 'network' | 'auth_expired',
  errorMessage: string,
): void {
  capture(AnalyticsEvent.BlockSubmitFailed, {
    block_id: blockId,
    response_kind: responseKind,
    failure_kind: failureKind,
    error_message: errorMessage,
    milliseconds_since_seen: millisecondsSinceSeen(blockId),
  });
}
