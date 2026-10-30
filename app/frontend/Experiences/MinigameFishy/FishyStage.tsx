import { PointerEventHandler, RefObject, useEffect, useMemo, useRef } from 'react';

import classNames from 'classnames';

import type { ExperienceParticipant, MinigameFishyBlock } from '@cctv/types';

import { buildAvatarSprite } from './avatarSprite';
import {
  FISHY,
  Motion,
  clamp01,
  initialWigglePhase,
  lerp,
  radius,
  speed,
  stepMotion,
  viewportSide,
  wiggle,
  wiggleFrequency,
} from './fishyMath';
import { DEATH_ANIMATION_MS, RenderedPlayer } from './fishyWorld';
import type { FishyControl } from './useFishyInput';
import { FishySummary, SUMMARY_INTERVAL_MS, summarize, useFishyWorld } from './useFishyWorld';

import styles from './MinigameFishy.module.scss';

interface FishyStageProps {
  block: MinigameFishyBlock;
  participants: ExperienceParticipant[];
  /** 'follow' centers and zooms on the player's own avatar; 'overview' fits the whole bowl. */
  mode: 'follow' | 'overview';
  ownSlot?: number | null;
  control?: RefObject<FishyControl>;
  onSummary?: (summary: FishySummary) => void;
  showNames?: boolean;
  rootRef?: RefObject<HTMLDivElement | null>;
  handlers?: {
    onPointerDown: PointerEventHandler<HTMLDivElement>;
    onPointerMove: PointerEventHandler<HTMLDivElement>;
    onPointerUp: PointerEventHandler<HTMLDivElement>;
    onPointerCancel: PointerEventHandler<HTMLDivElement>;
  };
  className?: string;
}

// How quickly the predicted own avatar is pulled onto the server position.
const CORRECTION_PER_SECOND = 5;
// Beyond this many radii of disagreement, snap rather than drift.
const SNAP_RADII = 4;
const CAMERA_EASE_PER_SECOND = 4;
const OVERVIEW_FILL = 0.94;
const GRID_SPACING = 250;
const MAX_FRAME_SECONDS = 0.1;

interface Palette {
  outside: string;
  inside: string;
  grid: string;
  border: string;
  ownRing: string;
  ring: string;
  dash: string;
  label: string;
  pellets: string[];
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    outside: v('--black', '#080808'),
    inside: v('--deep', '#0d0d0f'),
    grid: v('--phosphor-glow-faint', 'rgba(200, 240, 96, 0.05)'),
    border: v('--phosphor-glow-medium', 'rgba(200, 240, 96, 0.35)'),
    ownRing: v('--phosphor', '#c8f060'),
    ring: v('--hot-white', '#f0ede4'),
    dash: v('--amber', '#f5a623'),
    label: v('--hot-white', '#f0ede4'),
    pellets: [v('--phosphor', '#c8f060'), v('--amber', '#f5a623'), v('--hot-white', '#f0ede4')],
  };
}

function slotTint(slot: number): string {
  return `hsl(${(slot * 47) % 360} 55% 62%)`;
}

export default function FishyStage({
  block,
  participants,
  mode,
  ownSlot = null,
  control,
  onSummary,
  showNames = true,
  rootRef,
  handlers,
  className,
}: FishyStageProps) {
  const worldRef = useFishyWorld(block);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef(new Map<string, HTMLCanvasElement>());
  const onSummaryRef = useRef(onSummary);
  const modeRef = useRef(mode);

  useEffect(() => {
    onSummaryRef.current = onSummary;
    modeRef.current = mode;
  });

  const { roster, world_size: worldSize } = block.payload;
  const rosterParticipants = useMemo(() => {
    const byId = new Map(participants.map((p) => [p.id, p]));
    return roster.map((id) => byId.get(id));
  }, [participants, roster]);

  useEffect(() => {
    let cancelled = false;
    rosterParticipants.forEach((participant, slot) => {
      if (!participant || spritesRef.current.has(participant.id)) return;
      void buildAvatarSprite(participant.avatar, participant.name, slotTint(slot)).then(
        (sprite) => {
          if (!cancelled) spritesRef.current.set(participant.id, sprite);
          return sprite;
        },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [rosterParticipants]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const palette = readPalette();
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const phases = new Map<number, number>();
    let ownMotion: Motion | null = null;
    let cameraScale: number | null = null;
    let cameraX = worldSize / 2;
    let cameraY = worldSize / 2;
    let lastFrame = performance.now();
    let lastSummary = 0;
    let raf = 0;

    const predictOwn = (server: RenderedPlayer, dt: number, now: number): RenderedPlayer => {
      const ctl = control?.current;
      const track = ownSlot === null ? undefined : worldRef.current.players.get(ownSlot);
      if (!ctl || !track) return server;

      ownMotion ??= { x: server.x, y: server.y, vx: 0, vy: 0 };
      const nowSeconds = now / 1000;
      ownMotion = stepMotion(
        ownMotion,
        ctl.direction,
        server.size,
        dt,
        worldSize,
        nowSeconds,
        ctl.dash,
      );

      const errorX = track.toX - ownMotion.x;
      const errorY = track.toY - ownMotion.y;
      if (Math.hypot(errorX, errorY) > radius(server.size) * SNAP_RADII) {
        ownMotion = { ...ownMotion, x: track.toX, y: track.toY };
      } else {
        const k = 1 - Math.exp(-dt * CORRECTION_PER_SECOND);
        ownMotion.x += errorX * k;
        ownMotion.y += errorY * k;
      }

      const dashing = (ctl.dash !== null && nowSeconds < ctl.dash.until) || server.dashing;
      return {
        ...server,
        x: ownMotion.x,
        y: ownMotion.y,
        dashing,
        speedRatio: Math.hypot(ownMotion.vx, ownMotion.vy) / speed(server.size),
      };
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(Math.max(0, (now - lastFrame) / 1000), MAX_FRAME_SECONDS);
      lastFrame = now;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      const world = worldRef.current;
      const players = world.rendered(now);
      const followSelf = modeRef.current === 'follow' && ownSlot !== null;
      let own: RenderedPlayer | undefined;
      if (followSelf) {
        const index = players.findIndex((p) => p.slot === ownSlot);
        if (index >= 0) {
          own = predictOwn(players[index], dt, now);
          players[index] = own;
        }
      }
      if (!own) ownMotion = null;

      const ease = cameraScale === null ? 1 : 1 - Math.exp(-dt * CAMERA_EASE_PER_SECOND);
      const targetScale = own
        ? Math.sqrt(width * height) / viewportSide(worldSize, own.size)
        : (Math.min(width, height) / worldSize) * OVERVIEW_FILL;
      cameraScale = lerp(cameraScale ?? targetScale, targetScale, ease);
      cameraX = own ? own.x : lerp(cameraX, worldSize / 2, ease);
      cameraY = own ? own.y : lerp(cameraY, worldSize / 2, ease);

      const scale = cameraScale;
      const toScreenX = (x: number) => (x - cameraX) * scale + width / 2;
      const toScreenY = (y: number) => (y - cameraY) * scale + height / 2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = palette.outside;
      ctx.fillRect(0, 0, width, height);

      const left = toScreenX(0);
      const top = toScreenY(0);
      const span = worldSize * scale;
      ctx.fillStyle = palette.inside;
      ctx.fillRect(left, top, span, span);

      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let g = GRID_SPACING; g < worldSize; g += GRID_SPACING) {
        ctx.moveTo(toScreenX(g), top);
        ctx.lineTo(toScreenX(g), top + span);
        ctx.moveTo(left, toScreenY(g));
        ctx.lineTo(left + span, toScreenY(g));
      }
      ctx.stroke();
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, span, span);

      const viewLeft = cameraX - width / 2 / scale;
      const viewRight = cameraX + width / 2 / scale;
      const viewTop = cameraY - height / 2 / scale;
      const viewBottom = cameraY + height / 2 / scale;
      const pelletRadius = Math.max(1.5, FISHY.pelletRadius * scale);
      world.pellets.forEach(([x, y], index) => {
        if (x < viewLeft || x > viewRight || y < viewTop || y > viewBottom) return;
        ctx.fillStyle = palette.pellets[index % palette.pellets.length];
        ctx.beginPath();
        ctx.arc(toScreenX(x), toScreenY(y), pelletRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      const drawAvatar = (
        player: RenderedPlayer,
        x: number,
        y: number,
        size: number,
        alpha: number,
        animate: boolean,
      ) => {
        const r = radius(size) * scale;
        if (x + r < 0 || x - r > width || y + r < 0 || y - r > height) return;

        let phase = phases.get(player.slot) ?? initialWigglePhase(player.slot);
        if (animate) {
          phase +=
            Math.PI * 2 * wiggleFrequency(player.speedRatio, player.dashing, reducedMotion) * dt;
          phases.set(player.slot, phase);
        }
        const twist = animate
          ? wiggle(phase, player.speedRatio, reducedMotion)
          : { rotation: 0, skewX: 0, scaleX: 1, scaleY: 1 };

        const participant = rosterParticipants[player.slot];
        const sprite = participant ? spritesRef.current.get(participant.id) : undefined;
        const isOwn = player.slot === ownSlot;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.rotate((twist.rotation * Math.PI) / 180);
        ctx.transform(1, 0, twist.skewX, 1, 0, 0);
        ctx.scale(twist.scaleX, twist.scaleY);

        if (sprite) {
          ctx.drawImage(sprite, -r, -r, r * 2, r * 2);
        } else {
          ctx.fillStyle = slotTint(player.slot);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.lineWidth = isOwn ? 3 : 2;
        ctx.strokeStyle = player.dashing ? palette.dash : isOwn ? palette.ownRing : palette.ring;
        if (player.dashing) {
          ctx.shadowColor = palette.dash;
          ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.restore();

        if (showNames && participant && !(isOwn && followSelf) && alpha === 1) {
          const fontSize = Math.max(10, Math.min(18, r * 0.45));
          ctx.save();
          ctx.font = `${fontSize}px 'Barlow Condensed', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = palette.label;
          ctx.shadowColor = palette.outside;
          ctx.shadowBlur = 4;
          ctx.fillText(participant.name, x, y + r + 4);
          ctx.restore();
        }
      };

      players
        .toSorted((a, b) => a.size - b.size)
        .forEach((player) =>
          drawAvatar(player, toScreenX(player.x), toScreenY(player.y), player.size, 1, true),
        );

      for (const death of world.activeDeaths(now)) {
        const t = clamp01((now - death.at) / DEATH_ANIMATION_MS);
        const eater = players.find((p) => p.slot === death.by);
        const x = eater ? lerp(death.x, eater.x, t) : death.x;
        const y = eater ? lerp(death.y, eater.y, t) : death.y;
        drawAvatar(
          { slot: death.slot, x, y, size: death.size, dashing: false, speedRatio: 0 },
          toScreenX(x),
          toScreenY(y),
          death.size * (1 - t),
          1 - t,
          false,
        );
      }

      if (now - lastSummary >= SUMMARY_INTERVAL_MS) {
        lastSummary = now;
        onSummaryRef.current?.(summarize(world, ownSlot));
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [worldRef, worldSize, ownSlot, control, rosterParticipants, showNames]);

  return (
    <div ref={rootRef} className={classNames(styles.stage, className)} {...handlers}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
