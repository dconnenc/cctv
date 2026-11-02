import type { MinigameFishyFrameMessage } from '@cctv/types';

import { FISHY, clamp01, lerp, speed } from './fishyMath';

export interface PlayerTrack {
  slot: number;
  fromX: number;
  fromY: number;
  fromSize: number;
  toX: number;
  toY: number;
  toSize: number;
  dashing: boolean;
  arrivedAt: number;
  /** Server speed over the last frame relative to this size's top speed. */
  speedRatio: number;
}

export interface Death {
  slot: number;
  by: number;
  at: number;
  x: number;
  y: number;
  size: number;
}

export interface RenderedPlayer {
  slot: number;
  x: number;
  y: number;
  size: number;
  dashing: boolean;
  speedRatio: number;
}

// Frames stop arriving when nothing moves; after this long without one a
// player is treated as at rest.
const REST_AFTER_MS = FISHY.tickMs * 2;
export const DEATH_ANIMATION_MS = 450;

/**
 * Client copy of one game's world, fed by minigame_fishy_frame messages. Each
 * new server position becomes a short tween from wherever the player is drawn
 * now, so motion stays smooth even though frames are skipped while idle.
 */
export class FishyWorld {
  startedAt: string | null = null;
  lastT = -1;
  players = new Map<number, PlayerTrack>();
  pellets: Array<[number, number]> = [];
  out = new Map<number, number>();
  deaths: Death[] = [];

  apply(frame: MinigameFishyFrameMessage, now: number): void {
    if (frame.started_at !== this.startedAt) this.reset(frame.started_at);
    if (frame.keyframe ? frame.t < this.lastT : frame.t <= this.lastT) return;
    this.lastT = frame.t;

    if (frame.keyframe) {
      this.pellets = frame.pellet_field ?? [];
      this.out = new Map(frame.out ?? []);
    }
    for (const [index, x, y] of frame.pellets) {
      if (index < this.pellets.length) this.pellets[index] = [x, y];
    }

    for (const [slot, by] of frame.eliminated) {
      const track = this.players.get(slot);
      if (track) {
        const drawn = this.positionOf(track, now);
        this.deaths.push({ slot, by, at: now, x: drawn.x, y: drawn.y, size: drawn.size });
      }
      this.out.set(slot, by);
    }

    const alive = new Set<number>();
    for (const [slot, x, y, size, dashing] of frame.players) {
      alive.add(slot);
      const track = this.players.get(slot);
      if (!track) {
        this.players.set(slot, {
          slot,
          fromX: x,
          fromY: y,
          fromSize: size,
          toX: x,
          toY: y,
          toSize: size,
          dashing: dashing === 1,
          arrivedAt: now,
          speedRatio: 0,
        });
        continue;
      }

      const drawn = this.positionOf(track, now);
      const elapsedSeconds = Math.max(now - track.arrivedAt, FISHY.tickMs) / 1000;
      const distance = Math.hypot(x - track.toX, y - track.toY);
      track.speedRatio = distance / elapsedSeconds / speed(size);
      track.fromX = drawn.x;
      track.fromY = drawn.y;
      track.fromSize = drawn.size;
      track.toX = x;
      track.toY = y;
      track.toSize = size;
      track.dashing = dashing === 1;
      track.arrivedAt = now;
    }

    for (const slot of this.players.keys()) {
      if (!alive.has(slot)) this.players.delete(slot);
    }
  }

  positionOf(track: PlayerTrack, now: number): RenderedPlayer {
    const t = clamp01((now - track.arrivedAt) / FISHY.tickMs);
    return {
      slot: track.slot,
      x: lerp(track.fromX, track.toX, t),
      y: lerp(track.fromY, track.toY, t),
      size: lerp(track.fromSize, track.toSize, t),
      dashing: track.dashing,
      speedRatio: now - track.arrivedAt > REST_AFTER_MS ? 0 : track.speedRatio,
    };
  }

  rendered(now: number): RenderedPlayer[] {
    return [...this.players.values()].map((track) => this.positionOf(track, now));
  }

  activeDeaths(now: number): Death[] {
    this.deaths = this.deaths.filter((death) => now - death.at < DEATH_ANIMATION_MS);
    return this.deaths;
  }

  aliveCount(): number {
    return this.players.size;
  }

  /** Largest first. */
  leaders(limit: number): Array<{ slot: number; size: number }> {
    return [...this.players.values()]
      .map((track) => ({ slot: track.slot, size: track.toSize }))
      .toSorted((a, b) => b.size - a.size || a.slot - b.slot)
      .slice(0, limit);
  }

  private reset(startedAt: string): void {
    this.startedAt = startedAt;
    this.lastT = -1;
    this.players.clear();
    this.pellets = [];
    this.out.clear();
    this.deaths = [];
  }
}
