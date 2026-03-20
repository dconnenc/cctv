import { useEffect, useMemo, useRef, useState } from 'react';

import { Group, Layer, Line, Stage } from 'react-konva';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useLobbyDrawingState } from '@cctv/contexts/LobbyDrawingContext';
import type { ExperienceParticipant } from '@cctv/types';

import styles from './LobbyAvatars.module.scss';

const DRAW_SIZE = 320;
const AVATAR_DISPLAY_SIZE = 128;
const BASE_SCALE = AVATAR_DISPLAY_SIZE / DRAW_SIZE;

const SPEED_MIN = 25;
const SPEED_RANGE = 20;
const SCALE_AMPLITUDE = 0.07;
const SCALE_FREQ_MIN = 0.3;
const SCALE_FREQ_RANGE = 0.3;

interface AvatarMotion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scalePhase: number;
  scaleFreq: number;
}

function initMotion(w: number, h: number): AvatarMotion {
  const maxX = Math.max(0, w - AVATAR_DISPLAY_SIZE);
  const maxY = Math.max(0, h - AVATAR_DISPLAY_SIZE);
  const angle = Math.random() * Math.PI * 2;
  const speed = SPEED_MIN + Math.random() * SPEED_RANGE;
  return {
    x: Math.random() * maxX,
    y: Math.random() * maxY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    scalePhase: Math.random() * Math.PI * 2,
    scaleFreq: SCALE_FREQ_MIN + Math.random() * SCALE_FREQ_RANGE,
  };
}

export default function LobbyAvatars() {
  const { monitorView } = useExperience();
  const drawState = useLobbyDrawingState();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 960, h: 540 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const participants: ExperienceParticipant[] = useMemo(() => {
    const all = [...(monitorView?.participants || []), ...(monitorView?.hosts || [])];
    const seen = new Set<string>();
    return all.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [monitorView]);

  const respondedIds = useMemo(
    () => new Set(monitorView?.responded_participant_ids ?? []),
    [monitorView?.responded_participant_ids],
  );
  const hasActiveBlock = !!monitorView?.blocks[0] || !!monitorView?.participant_block_active;

  const motionsRef = useRef<Map<string, AvatarMotion>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const [, forceUpdate] = useState(0);

  const prevSizeRef = useRef(size);
  useEffect(() => {
    const motions = motionsRef.current;
    const sizeChanged = prevSizeRef.current.w !== size.w || prevSizeRef.current.h !== size.h;
    prevSizeRef.current = size;

    for (const p of participants) {
      if (!motions.has(p.id) || sizeChanged) {
        motions.set(p.id, initMotion(size.w, size.h));
      }
    }
    for (const id of motions.keys()) {
      if (!participants.some((p) => p.id === id)) {
        motions.delete(id);
      }
    }
  }, [participants, size]);

  useEffect(() => {
    const maxX = Math.max(0, size.w - AVATAR_DISPLAY_SIZE);
    const maxY = Math.max(0, size.h - AVATAR_DISPLAY_SIZE);

    const animate = (timestamp: number) => {
      const dt =
        lastTimeRef.current !== null ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.1) : 0;
      lastTimeRef.current = timestamp;

      for (const m of motionsRef.current.values()) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.scalePhase += m.scaleFreq * dt;

        if (m.x < 0) {
          m.x = 0;
          m.vx = Math.abs(m.vx);
        } else if (m.x > maxX) {
          m.x = maxX;
          m.vx = -Math.abs(m.vx);
        }
        if (m.y < 0) {
          m.y = 0;
          m.vy = Math.abs(m.vy);
        } else if (m.y > maxY) {
          m.y = maxY;
          m.vy = -Math.abs(m.vy);
        }
      }

      forceUpdate((n) => n + 1);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [size]);

  return (
    <div className={styles.root}>
      <div className={styles.stageWrap} ref={containerRef}>
        <Stage width={size.w} height={size.h}>
          <Layer>
            {participants.map((p) => {
              const strokes = drawState.strokes[p.id] ?? [];
              if (!strokes.length) return null;

              const motion = motionsRef.current.get(p.id);
              if (!motion) return null;

              const scale = BASE_SCALE * (1 + SCALE_AMPLITUDE * Math.sin(motion.scalePhase));
              const isGrayed = hasActiveBlock && p.role !== 'host' && !respondedIds.has(p.id);

              return (
                <Group
                  key={p.id}
                  x={motion.x}
                  y={motion.y}
                  scaleX={scale}
                  scaleY={scale}
                  opacity={isGrayed ? 0.3 : 1}
                >
                  {strokes.map((s, idx) => (
                    <Line
                      key={idx}
                      points={s.points}
                      stroke={isGrayed ? '#666' : s.color}
                      strokeWidth={s.width}
                      lineCap="round"
                    />
                  ))}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
