/**
 * Participant JWTs live in localStorage and routinely surface in request logs and
 * error messages, so anything headed for a feedback report is scrubbed before it
 * leaves the browser. The server repeats this pass — this one exists so the
 * secrets never travel in the first place.
 */
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]+/g;
const BEARER_PATTERN = /\b(?:bearer|authorization:?|api[_-]?key:?|token:?)\s+\S+/gi;
const EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
const OPAQUE_TOKEN_PATTERN = /\b[A-Za-z0-9_-]{40,}\b/g;

export const REDACTED = '[redacted]';

export function redact(value: string): string {
  return value
    .replace(JWT_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, REDACTED)
    .replace(EMAIL_PATTERN, REDACTED)
    .replace(OPAQUE_TOKEN_PATTERN, REDACTED);
}
