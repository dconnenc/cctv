import { describe, expect, it } from 'vitest';

import type { MinigameFishyFrameMessage } from '@cctv/types';

import { FISHY } from './fishyMath';
import { FishyWorld } from './fishyWorld';

const STARTED_AT = '2026-01-01T00:00:00.000Z';

function frame(overrides: Partial<MinigameFishyFrameMessage>): MinigameFishyFrameMessage {
  return {
    type: 'minigame_fishy_frame',
    block_id: 'block-1',
    started_at: STARTED_AT,
    t: 1,
    players: [],
    eliminated: [],
    pellets: [],
    ...overrides,
  };
}

describe('FishyWorld', () => {
  it('loads pellets and eliminations from a keyframe', () => {
    const world = new FishyWorld();
    world.apply(
      frame({
        keyframe: true,
        players: [[0, 100, 100, 1, 0]],
        pellet_field: [
          [1, 2],
          [3, 4],
        ],
        out: [[1, 0]],
      }),
      0,
    );

    expect(world.pellets).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(world.out.get(1)).toBe(0);
    expect(world.aliveCount()).toBe(1);
  });

  it('tweens a player from where it is drawn to its new position over one tick', () => {
    const world = new FishyWorld();
    world.apply(frame({ t: 1, players: [[0, 100, 100, 1, 0]] }), 0);
    world.apply(frame({ t: 2, players: [[0, 200, 100, 1, 0]] }), 1000);

    const [halfway] = world.rendered(1000 + FISHY.tickMs / 2);
    expect(halfway.x).toBeCloseTo(150);
    const [arrived] = world.rendered(1000 + FISHY.tickMs * 2);
    expect(arrived.x).toBe(200);
  });

  it('ignores stale and duplicate deltas', () => {
    const world = new FishyWorld();
    world.apply(frame({ t: 5, players: [[0, 100, 100, 1, 0]] }), 0);
    world.apply(frame({ t: 5, players: [[0, 900, 900, 1, 0]] }), 10);
    world.apply(frame({ t: 4, players: [[0, 900, 900, 1, 0]] }), 20);

    expect(world.players.get(0)?.toX).toBe(100);
  });

  it('applies pellet respawns', () => {
    const world = new FishyWorld();
    world.apply(frame({ keyframe: true, t: 1, pellet_field: [[1, 1]] }), 0);
    world.apply(frame({ t: 2, pellets: [[0, 50, 60]] }), 10);

    expect(world.pellets).toEqual([[50, 60]]);
  });

  it('records an elimination with a death animation and drops the player', () => {
    const world = new FishyWorld();
    world.apply(
      frame({
        t: 1,
        players: [
          [0, 100, 100, 1.2, 0],
          [1, 110, 100, 1, 0],
        ],
      }),
      0,
    );
    world.apply(frame({ t: 2, players: [[0, 105, 100, 1.4, 0]], eliminated: [[1, 0]] }), 100);

    expect(world.out.get(1)).toBe(0);
    expect(world.aliveCount()).toBe(1);
    expect(world.activeDeaths(150)).toHaveLength(1);
    expect(world.activeDeaths(10_000)).toHaveLength(0);
  });

  it('starts fresh for a new game generation', () => {
    const world = new FishyWorld();
    world.apply(frame({ t: 50, players: [[0, 100, 100, 1, 0]] }), 0);
    world.apply(frame({ started_at: 'later', t: 1, players: [[3, 5, 5, 1, 0]] }), 10);

    expect([...world.players.keys()]).toEqual([3]);
  });

  it('ranks leaders by size', () => {
    const world = new FishyWorld();
    world.apply(
      frame({
        players: [
          [0, 0, 0, 1.1, 0],
          [1, 0, 0, 1.9, 0],
          [2, 0, 0, 1.5, 0],
        ],
      }),
      0,
    );

    expect(world.leaders(2).map((l) => l.slot)).toEqual([1, 2]);
  });
});
