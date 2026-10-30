import { PointerEvent, RefObject, useCallback, useEffect, useMemo, useRef } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import type { JsonObject } from '@cctv/types';

import { FISHY, Vec, angleBetweenDeg, unit } from './fishyMath';

export const INPUT_MIN_INTERVAL_MS = 100;
export const INPUT_MIN_ANGLE_DEG = 5;
export const DOUBLE_TAP_WINDOW_MS = 300;
export const DOUBLE_TAP_MAX_DISTANCE_PX = 40;

interface InputSenderOptions {
  minIntervalMs?: number;
  minAngleDeg?: number;
  now?: () => number;
}

/**
 * Sends steering only when it changes: touch start, touch end, or a turn of
 * more than `minAngleDeg`. Changes are rate-limited; the latest value waiting
 * out the interval replaces any older one, so a held finger sends nothing and a
 * swirling finger sends at most one update per interval.
 */
export function createInputSender(
  send: (direction: Vec | null) => void,
  {
    minIntervalMs = INPUT_MIN_INTERVAL_MS,
    minAngleDeg = INPUT_MIN_ANGLE_DEG,
    now = () => performance.now(),
  }: InputSenderOptions = {},
) {
  let lastSent: Vec | null | undefined;
  let lastSentAt = -Infinity;
  let pending: Vec | null | undefined;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const differs = (next: Vec | null) => {
    if (lastSent === undefined) return true;
    if (next === null || lastSent === null) return next !== lastSent;
    return angleBetweenDeg(lastSent, next) > minAngleDeg;
  };

  const flush = (direction: Vec | null) => {
    lastSent = direction;
    lastSentAt = now();
    pending = undefined;
    send(direction);
  };

  const update = (direction: Vec | null) => {
    if (!differs(direction)) {
      pending = undefined;
      return;
    }

    const wait = minIntervalMs - (now() - lastSentAt);
    if (wait <= 0) {
      flush(direction);
      return;
    }

    pending = direction;
    timer ??= setTimeout(() => {
      timer = null;
      if (pending !== undefined && differs(pending)) flush(pending);
    }, wait);
  };

  const dispose = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = undefined;
  };

  return { update, dispose };
}

export function createDoubleTapDetector({
  windowMs = DOUBLE_TAP_WINDOW_MS,
  maxDistancePx = DOUBLE_TAP_MAX_DISTANCE_PX,
} = {}) {
  let last: { at: number; x: number; y: number } | null = null;

  return (at: number, x: number, y: number): boolean => {
    if (last && at - last.at <= windowMs && Math.hypot(x - last.x, y - last.y) <= maxDistancePx) {
      last = null;
      return true;
    }
    last = { at, x, y };
    return false;
  };
}

export interface FishyControl {
  /** Current steering direction, or null with no finger down. */
  direction: Vec | null;
  /** Locally predicted dash, for the player's own motion. */
  dash: { dx: number; dy: number; until: number } | null;
  /** performance.now() seconds at which the next dash is allowed. */
  dashReadyAt: number;
}

interface UseFishyInputArgs {
  blockId: string;
  startedAt: string | null;
  enabled: boolean;
  surfaceRef: RefObject<HTMLElement | null>;
}

/**
 * Steering for the phone. Direction is the vector from the surface center —
 * where the player's own avatar is drawn — to the finger.
 */
export function useFishyInput({ blockId, startedAt, enabled, surfaceRef }: UseFishyInputArgs) {
  const { experiencePerform } = useExperience();
  const controlRef = useRef<FishyControl>({ direction: null, dash: null, dashReadyAt: 0 });
  const pointerIdRef = useRef<number | null>(null);

  const sender = useMemo(
    () =>
      createInputSender((direction) => {
        if (!startedAt) return;
        const message: JsonObject = { block_id: blockId, started_at: startedAt };
        if (direction) {
          message.dx = round(direction.x);
          message.dy = round(direction.y);
        }
        experiencePerform?.('fishy_input', message);
      }),
    [blockId, startedAt, experiencePerform],
  );
  const detectDoubleTap = useMemo(() => createDoubleTapDetector(), []);

  useEffect(() => () => sender.dispose(), [sender]);

  useEffect(() => {
    controlRef.current = { direction: null, dash: null, dashReadyAt: 0 };
  }, [startedAt]);

  const directionFrom = useCallback(
    (event: PointerEvent<HTMLElement>): Vec | null => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return unit(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      );
    },
    [surfaceRef],
  );

  const steer = useCallback(
    (direction: Vec | null) => {
      controlRef.current.direction = direction;
      sender.update(direction);
    },
    [sender],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      pointerIdRef.current = event.pointerId;
      const direction = directionFrom(event);
      steer(direction);

      if (
        !detectDoubleTap(event.timeStamp, event.clientX, event.clientY) ||
        !direction ||
        !startedAt
      ) {
        return;
      }
      const nowSeconds = performance.now() / 1000;
      const control = controlRef.current;
      if (nowSeconds < control.dashReadyAt) return;

      control.dash = { dx: direction.x, dy: direction.y, until: nowSeconds + FISHY.dashSeconds };
      control.dashReadyAt = nowSeconds + FISHY.dashCooldownSeconds;
      experiencePerform?.('fishy_dash', {
        block_id: blockId,
        started_at: startedAt,
        dx: round(direction.x),
        dy: round(direction.y),
      });
    },
    [enabled, directionFrom, steer, detectDoubleTap, startedAt, blockId, experiencePerform],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled || pointerIdRef.current !== event.pointerId) return;
      steer(directionFrom(event));
    },
    [enabled, directionFrom, steer],
  );

  const onPointerEnd = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      pointerIdRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      steer(null);
    },
    [steer],
  );

  return {
    controlRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
