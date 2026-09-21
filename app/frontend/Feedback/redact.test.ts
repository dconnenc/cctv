import { describe, expect, it } from 'vitest';

import { REDACTED, redact } from './redact';

describe('redact', () => {
  it('removes JWTs, which live in localStorage and end up in logged requests', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.s1gnatur3';

    expect(redact(`loading ${jwt} now`)).not.toContain(jwt);
  });

  it('removes bearer headers', () => {
    expect(redact('Authorization: Bearer abc.def.ghi')).toContain(REDACTED);
  });

  it('removes email addresses', () => {
    expect(redact('failed for someone@example.com')).not.toContain('someone@example.com');
  });

  it('removes long opaque tokens', () => {
    expect(redact(`key ${'a'.repeat(48)}`)).toContain(REDACTED);
  });

  it('leaves ordinary log text intact', () => {
    expect(redact('websocket reconnected after 3 attempts')).toBe(
      'websocket reconnected after 3 attempts',
    );
  });
});
