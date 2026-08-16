import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  millisecondsSinceSeen,
  resetBlockImpressions,
  trackBlockSeen,
  trackSubmissionFailed,
  trackSubmissionSucceeded,
} from './blockImpressions';
import { AnalyticsEvent } from './events';

const { clientMock } = vi.hoisted(() => ({ clientMock: { capture: vi.fn() } }));
vi.mock('./client', () => clientMock);

beforeEach(() => {
  clientMock.capture.mockClear();
  resetBlockImpressions();
});

describe('trackBlockSeen', () => {
  it('captures the impression with block identity', () => {
    trackBlockSeen({ blockId: 'block-1', blockKind: 'question' });

    expect(clientMock.capture).toHaveBeenCalledWith(AnalyticsEvent.BlockSeen, {
      block_id: 'block-1',
      block_kind: 'question',
      experience_code: undefined,
    });
  });

  it('only counts the first sighting, so websocket remounts do not inflate it', () => {
    trackBlockSeen({ blockId: 'block-1', blockKind: 'question' });
    trackBlockSeen({ blockId: 'block-1', blockKind: 'question' });
    trackBlockSeen({ blockId: 'block-1', blockKind: 'question' });

    expect(clientMock.capture).toHaveBeenCalledTimes(1);
  });

  it('tracks distinct blocks separately', () => {
    trackBlockSeen({ blockId: 'block-1', blockKind: 'question' });
    trackBlockSeen({ blockId: 'block-2', blockKind: 'poll' });

    expect(clientMock.capture).toHaveBeenCalledTimes(2);
  });
});

describe('millisecondsSinceSeen', () => {
  it('measures from the first impression', () => {
    trackBlockSeen({ blockId: 'block-1', blockKind: 'question' });
    expect(millisecondsSinceSeen('block-1')).toBeGreaterThanOrEqual(0);
  });

  it('is undefined for a block that was never seen', () => {
    expect(millisecondsSinceSeen('never-rendered')).toBeUndefined();
  });
});

describe('submission tracking', () => {
  it('attaches time-on-prompt to a successful submit', () => {
    trackBlockSeen({ blockId: 'block-1', blockKind: 'question' });
    clientMock.capture.mockClear();

    trackSubmissionSucceeded('block-1', 'question');

    expect(clientMock.capture).toHaveBeenCalledWith(
      AnalyticsEvent.ResponseSubmitted,
      expect.objectContaining({
        block_id: 'block-1',
        response_kind: 'question',
        milliseconds_since_seen: expect.any(Number),
      }),
    );
  });

  it('records why a submit failed', () => {
    trackSubmissionFailed('block-1', 'poll', 'auth_expired', 'Authentication expired');

    expect(clientMock.capture).toHaveBeenCalledWith(
      AnalyticsEvent.BlockSubmitFailed,
      expect.objectContaining({
        block_id: 'block-1',
        response_kind: 'poll',
        failure_kind: 'auth_expired',
        error_message: 'Authentication expired',
      }),
    );
  });
});
