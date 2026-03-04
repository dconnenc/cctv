import { useEffect, useMemo, useRef, useState } from 'react';

import { Group, Layer, Line, Stage } from 'react-konva';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useLobbyDrawingState } from '@cctv/contexts/LobbyDrawingContext';
import { ExperienceParticipant } from '@cctv/types';

import styles from './LobbyAvatars.module.scss';

const DRAW_SIZE = 320;
const AVATAR_DISPLAY_SIZE = 128;

function stableRandomPosition(id: string, w: number, h: number, avatarSize: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(hash);
  const maxX = Math.max(0, w - avatarSize);
  const maxY = Math.max(0, h - avatarSize);
  return {
    x: maxX > 0 ? abs % maxX : 0,
    y: maxY > 0 ? ((abs >>> 16) * 7919) % maxY : 0,
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
      const w = el.clientWidth;
      const h = Math.round((w * 9) / 16);
      setSize({ w, h });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const participants: ExperienceParticipant[] = useMemo(
    () => [...(monitorView?.participants || []), ...(monitorView?.hosts || [])],
    [monitorView],
  );

  const avatarScale = AVATAR_DISPLAY_SIZE / DRAW_SIZE;

  return (
    <div className={styles.root}>
      <div className={styles.stageWrap} ref={containerRef}>
        <Stage width={size.w} height={size.h}>
          <Layer>
            {participants.map((p) => {
              const strokes = drawState.strokes[p.id] ?? [];

              if (!strokes.length) return null;

              const pos = stableRandomPosition(p.id, size.w, size.h, AVATAR_DISPLAY_SIZE);

              return (
                <Group key={p.id} x={pos.x} y={pos.y} scaleX={avatarScale} scaleY={avatarScale}>
                  {strokes.map((s, idx) => (
                    <Line
                      key={idx}
                      points={s.points}
                      stroke={s.color}
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
