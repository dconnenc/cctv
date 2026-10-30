import { describe, expect, it } from 'vitest';

import {
  FISHY,
  START_VIEW_AREA_FRACTION,
  initialWigglePhase,
  speed,
  stepMotion,
  viewportSide,
  wiggle,
  wiggleFrequency,
} from './fishyMath';

const WORLD = 4000;

describe('viewportSide', () => {
  it('shows 1/32 of the world area at the starting size', () => {
    const side = viewportSide(WORLD, 1);
    expect((side * side) / (WORLD * WORLD)).toBeCloseTo(START_VIEW_AREA_FRACTION);
  });

  it('zooms out as the player grows', () => {
    expect(viewportSide(WORLD, 2)).toBeCloseTo(viewportSide(WORLD, 1) * 2);
  });

  it('never shows more than the whole world', () => {
    expect(viewportSide(WORLD, 50)).toBe(WORLD);
  });
});

describe('speed', () => {
  it('is 0.25% slower for every 1% of growth', () => {
    expect(speed(1.01) / speed(1)).toBeCloseTo(0.9975, 10);
  });
});

describe('stepMotion', () => {
  const rest = { x: 1000, y: 1000, vx: 0, vy: 0 };

  it('accelerates toward the steering direction', () => {
    const next = stepMotion(rest, { x: 1, y: 0 }, 1, 0.05, WORLD, 0, null);
    expect(next.vx).toBeGreaterThan(0);
    expect(next.x).toBeGreaterThan(rest.x);
    expect(next.y).toBe(rest.y);
  });

  it('glides to a stop without a direction', () => {
    let motion = { ...rest, vx: speed(1) };
    motion = stepMotion(motion, null, 1, 0.1, WORLD, 0, null);
    expect(motion.vx).toBeGreaterThan(0);
    for (let i = 0; i < 5; i += 1) motion = stepMotion(motion, null, 1, 0.1, WORLD, 0, null);
    expect(motion.vx).toBe(0);
  });

  it('bursts at dash speed while a dash is active', () => {
    const dash = { dx: 0, dy: 1, until: 1 };
    const next = stepMotion(rest, { x: 1, y: 0 }, 1, 0.05, WORLD, 0.5, dash);
    expect(next.vy).toBeCloseTo(speed(1) * FISHY.dashMultiplier);
    expect(next.vx).toBe(0);
  });

  it('stays finite at rest with no elapsed time', () => {
    const next = stepMotion(rest, null, 1, 0, WORLD, 0, null);
    expect(next).toEqual(rest);
  });

  it('stops at the walls', () => {
    const next = stepMotion(
      { x: 1, y: 1000, vx: -speed(1), vy: 0 },
      { x: -1, y: 0 },
      1,
      0.1,
      WORLD,
      0,
      null,
    );
    expect(next.x).toBe(0);
    expect(next.vx).toBe(0);
  });
});

describe('wiggle', () => {
  it('keeps the twist within a few degrees', () => {
    for (let phase = 0; phase < Math.PI * 2; phase += 0.1) {
      expect(Math.abs(wiggle(phase, 1, false).rotation)).toBeLessThanOrEqual(10);
    }
  });

  it('twists harder when moving than when idle', () => {
    const peak = Math.PI / 2;
    expect(Math.abs(wiggle(peak, 1, false).rotation)).toBeGreaterThan(
      Math.abs(wiggle(peak, 0, false).rotation),
    );
  });

  it('preserves area when squashing', () => {
    const { scaleX, scaleY } = wiggle(Math.PI / 4, 1, false);
    expect(scaleX).not.toBe(1);
    expect(scaleX * scaleY).toBeCloseTo(1);
  });

  it('shears against the twist', () => {
    const { rotation, skewX } = wiggle(Math.PI / 2, 1, false);
    expect(Math.sign(skewX)).toBe(-Math.sign(rotation));
  });

  it('speeds up with movement and doubles while dashing', () => {
    expect(wiggleFrequency(1, false, false)).toBeGreaterThan(wiggleFrequency(0, false, false));
    expect(wiggleFrequency(1, true, false)).toBeCloseTo(wiggleFrequency(1, false, false) * 2);
  });

  it('offsets each slot so neighbours do not wiggle in sync', () => {
    const phases = [0, 1, 2, 3].map(initialWigglePhase);
    expect(new Set(phases.map((p) => p.toFixed(3))).size).toBe(4);
  });

  it('calms to half the idle twist under reduced motion', () => {
    const peak = Math.PI / 2;
    expect(Math.abs(wiggle(peak, 1, true).rotation)).toBeCloseTo(
      Math.abs(wiggle(peak, 0, false).rotation) / 2,
    );
    expect(wiggleFrequency(1, true, true)).toBe(wiggleFrequency(0, false, false));
  });
});
