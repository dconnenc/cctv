import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Vec } from './fishyMath';
import { createDoubleTapDetector, createInputSender } from './useFishyInput';

describe('createInputSender', () => {
  let clock = 0;
  let sent: Array<Vec | null>;

  beforeEach(() => {
    vi.useFakeTimers();
    clock = 1000;
    sent = [];
  });

  afterEach(() => vi.useRealTimers());

  const advance = (ms: number) => {
    clock += ms;
    vi.advanceTimersByTime(ms);
  };

  const build = () =>
    createInputSender((direction) => sent.push(direction), {
      minIntervalMs: 100,
      minAngleDeg: 5,
      now: () => clock,
    });

  it('sends the first touch immediately', () => {
    build().update({ x: 1, y: 0 });
    expect(sent).toEqual([{ x: 1, y: 0 }]);
  });

  it('sends nothing while the direction turns less than 5°', () => {
    const sender = build();
    sender.update({ x: 1, y: 0 });
    advance(200);
    sender.update({ x: Math.cos(0.05), y: Math.sin(0.05) });
    advance(200);
    expect(sent).toHaveLength(1);
  });

  it('sends a turn larger than 5°', () => {
    const sender = build();
    sender.update({ x: 1, y: 0 });
    advance(200);
    sender.update({ x: 0, y: 1 });
    expect(sent).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
  });

  it('caps updates at 10 per second and coalesces to the latest', () => {
    const sender = build();
    sender.update({ x: 1, y: 0 });
    advance(20);
    sender.update({ x: 0, y: 1 });
    advance(20);
    sender.update({ x: -1, y: 0 });
    expect(sent).toHaveLength(1);

    advance(100);
    expect(sent).toEqual([
      { x: 1, y: 0 },
      { x: -1, y: 0 },
    ]);
  });

  it('sends the finger lifting', () => {
    const sender = build();
    sender.update({ x: 1, y: 0 });
    advance(150);
    sender.update(null);
    expect(sent).toEqual([{ x: 1, y: 0 }, null]);
  });

  it('drops a queued change that the finger returns from', () => {
    const sender = build();
    sender.update({ x: 1, y: 0 });
    advance(20);
    sender.update({ x: 0, y: 1 });
    sender.update({ x: 1, y: 0 });
    advance(200);
    expect(sent).toHaveLength(1);
  });
});

describe('createDoubleTapDetector', () => {
  it('detects two taps close in time and space', () => {
    const detect = createDoubleTapDetector({ windowMs: 300, maxDistancePx: 40 });
    expect(detect(0, 100, 100)).toBe(false);
    expect(detect(200, 110, 105)).toBe(true);
  });

  it('ignores taps that are too slow or too far apart', () => {
    const detect = createDoubleTapDetector({ windowMs: 300, maxDistancePx: 40 });
    detect(0, 100, 100);
    expect(detect(400, 100, 100)).toBe(false);
    expect(detect(500, 300, 300)).toBe(false);
  });

  it('needs a fresh pair after a double tap', () => {
    const detect = createDoubleTapDetector();
    detect(0, 0, 0);
    expect(detect(100, 0, 0)).toBe(true);
    expect(detect(200, 0, 0)).toBe(false);
  });
});
