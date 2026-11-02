// Physics constants mirror app/services/minigames/fishy/config.rb. The server
// is authoritative; the client only needs them to predict its own motion and
// size things on screen.
export const FISHY = {
  tickMs: 1000 / 15,
  startRadius: 50,
  baseSpeed: 280,
  speedExponent: Math.log(0.9975) / Math.log(1.01),
  steerSeconds: 0.1,
  glideSeconds: 0.3,
  dashMultiplier: 3,
  dashSeconds: 0.25,
  dashCooldownSeconds: 4,
  pelletRadius: 8,
  restSpeed: 0.5,
} as const;

// At size 1 a phone sees 1/32 of the world's area; the view grows linearly with
// size so the player's own avatar keeps a constant on-screen size.
export const START_VIEW_AREA_FRACTION = 1 / 32;
export const ZOOM_EXPONENT = 1;

export interface Vec {
  x: number;
  y: number;
}

export interface Motion {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Dash {
  dx: number;
  dy: number;
  until: number;
}

export function radius(size: number): number {
  return FISHY.startRadius * size;
}

export function speed(size: number): number {
  return FISHY.baseSpeed * size ** FISHY.speedExponent;
}

/** Side length, in world units, of the square region a phone shows. */
export function viewportSide(worldSize: number, size: number): number {
  return Math.min(
    worldSize,
    worldSize * Math.sqrt(START_VIEW_AREA_FRACTION) * size ** ZOOM_EXPONENT,
  );
}

export function unit(dx: number, dy: number): Vec | null {
  const magnitude = Math.hypot(dx, dy);
  if (!Number.isFinite(magnitude) || magnitude < 1e-6) return null;
  return { x: dx / magnitude, y: dy / magnitude };
}

export function angleBetweenDeg(a: Vec, b: Vec): number {
  const dot = a.x * b.x + a.y * b.y;
  const magnitude = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);
  if (magnitude === 0) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / magnitude))) * 180) / Math.PI;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

/**
 * Same steering model as Simulation#move: approach the target velocity at a
 * bounded rate (fast while steering, slower glide to a stop), a fixed-velocity
 * burst while dashing, and walls that stop motion on that axis.
 */
export function stepMotion(
  motion: Motion,
  direction: Vec | null,
  size: number,
  dt: number,
  worldSize: number,
  now: number,
  dash: Dash | null,
): Motion {
  const top = speed(size);
  let { vx, vy } = motion;

  if (dash && now < dash.until) {
    vx = dash.dx * top * FISHY.dashMultiplier;
    vy = dash.dy * top * FISHY.dashMultiplier;
  } else {
    const targetX = direction ? direction.x * top : 0;
    const targetY = direction ? direction.y * top : 0;
    const rate = top / (direction ? FISHY.steerSeconds : FISHY.glideSeconds);
    const maxChange = rate * dt;
    const dvx = targetX - vx;
    const dvy = targetY - vy;
    const distance = Math.hypot(dvx, dvy);

    if (distance <= maxChange || distance === 0) {
      vx = targetX;
      vy = targetY;
    } else {
      vx += (dvx / distance) * maxChange;
      vy += (dvy / distance) * maxChange;
    }

    if (!direction && Math.hypot(vx, vy) < FISHY.restSpeed) {
      vx = 0;
      vy = 0;
    }
  }

  let x = motion.x + vx * dt;
  let y = motion.y + vy * dt;
  if (x < 0 || x > worldSize) {
    x = Math.min(worldSize, Math.max(0, x));
    vx = 0;
  }
  if (y < 0 || y > worldSize) {
    y = Math.min(worldSize, Math.max(0, y));
    vy = 0;
  }

  return { x, y, vx, vy };
}

// --- Wiggle (torsion) --------------------------------------------------------

const WIGGLE_IDLE_DEG = 3;
const WIGGLE_MOVING_DEG = 7;
const WIGGLE_IDLE_HZ = 0.8;
const WIGGLE_MOVING_HZ = 1.7;
const WIGGLE_SKEW_RATIO = 0.5;
const WIGGLE_SQUASH = 0.03;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export interface Wiggle {
  /** Degrees. */
  rotation: number;
  /** Horizontal shear factor (tan of the shear angle). */
  skewX: number;
  scaleX: number;
  scaleY: number;
}

/** Spreads starting phases so neighbours never twist in sync. */
export function initialWigglePhase(slot: number): number {
  return (slot * GOLDEN_ANGLE) % (Math.PI * 2);
}

/** Wiggle cycles per second. Rises with speed; doubles while dashing. */
export function wiggleFrequency(
  speedRatio: number,
  dashing: boolean,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return WIGGLE_IDLE_HZ;
  const hz = WIGGLE_IDLE_HZ + WIGGLE_MOVING_HZ * clamp01(speedRatio);
  return dashing ? hz * 2 : hz;
}

/**
 * A body twist rather than a spin: rotation with a counter-phase shear and an
 * area-preserving squash and stretch at twice the twist rate. `phase` is
 * accumulated by the renderer (phase += 2π · frequency · dt) so frequency can
 * change smoothly without the motion jumping.
 */
export function wiggle(phase: number, speedRatio: number, reducedMotion: boolean): Wiggle {
  const maxDeg = WIGGLE_IDLE_DEG + WIGGLE_MOVING_DEG;
  const amplitudeDeg = reducedMotion
    ? WIGGLE_IDLE_DEG * 0.5
    : WIGGLE_IDLE_DEG + WIGGLE_MOVING_DEG * clamp01(speedRatio);
  const twist = Math.sin(phase);
  const squash = WIGGLE_SQUASH * (amplitudeDeg / maxDeg) * Math.sin(phase * 2);

  return {
    rotation: amplitudeDeg * twist,
    skewX: -Math.tan((amplitudeDeg * WIGGLE_SKEW_RATIO * Math.PI) / 180) * twist,
    scaleX: 1 + squash,
    scaleY: 1 / (1 + squash),
  };
}
