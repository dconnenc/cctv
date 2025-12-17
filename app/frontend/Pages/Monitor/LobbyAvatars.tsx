import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { Image as KonvaImage, Layer, Line, Stage } from 'react-konva';

import { useExperience } from '@cctv/contexts';
import { ExperienceParticipant } from '@cctv/types';

import styles from './LobbyAvatars.module.scss';

function useHtmlImage(src?: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = src;
    return () => setImg(null);
  }, [src]);
  return img;
}

function AvatarSprite({
  id,
  src,
  x,
  y,
  size,
}: {
  id: string;
  src?: string;
  x: number;
  y: number;
  size: number;
}) {
  const img = useHtmlImage(src);
  if (!img) return null as any;
  return <KonvaImage key={id} image={img} x={x} y={y} width={size} height={size} />;
}

function computeGridPositions(n: number, width: number, height: number, itemSize: number) {
  if (n <= 0) return [] as { x: number; y: number }[];
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellW = width / cols;
  const cellH = height / rows;
  const res: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (res.length >= n) break;
      const cx = c * cellW + cellW / 2 - itemSize / 2;
      const cy = r * cellH + cellH / 2 - itemSize / 2;
      res.push({ x: cx, y: cy });
    }
  }
  return res;
}

export default function LobbyAvatars() {
  const { monitorView, registerLobbyDrawingDispatch, unregisterLobbyDrawingDispatch } =
    useExperience();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 960, h: 540 });

  type Stroke = { points: number[]; color: string; width: number; ended?: boolean };
  type State = {
    strokes: { [participantId: string]: Stroke[] };
    positions: { [participantId: string]: { x: number; y: number } };
  };
  type Action =
    | { type: 'reset' }
    | { type: 'drawing_update'; participant_id: string; operation: string; data?: any };

  const [drawState, dispatch] = useReducer(
    (state: State, action: Action): State => {
      switch (action.type) {
        case 'reset':
          return { strokes: {}, positions: {} };
        case 'drawing_update': {
          const { participant_id, operation, data } = action as any;
          const existing = state.strokes[participant_id] || [];
          if (operation === 'clear_all') {
            return { strokes: {}, positions: {} };
          } else if (operation === 'stroke_started') {
            const stroke: Stroke = {
              points: data?.points || [],
              color: data?.color || '#000',
              width: data?.width || 4,
            };
            return {
              ...state,
              strokes: { ...state.strokes, [participant_id]: [...existing, stroke] },
              positions: state.positions,
            };
          } else if (operation === 'stroke_points_appended') {
            const next = existing.slice();
            if (next.length === 0) return state;
            const s = { ...next[next.length - 1] };
            s.points = [...s.points, ...(data?.points || [])];
            next[next.length - 1] = s;
            return {
              ...state,
              strokes: { ...state.strokes, [participant_id]: next },
              positions: state.positions,
            };
          } else if (operation === 'stroke_ended') {
            const next = existing.slice();
            if (next.length === 0) return state;
            const s = { ...next[next.length - 1], ended: true };
            next[next.length - 1] = s;
            return {
              ...state,
              strokes: { ...state.strokes, [participant_id]: next },
              positions: state.positions,
            };
          } else if (operation === 'avatar_position') {
            const pos = (data && data.position) || undefined;
            if (!pos) return state;
            return {
              ...state,
              strokes: state.strokes,
              positions: { ...state.positions, [participant_id]: pos },
            };
          }
          return state;
        }
        default:
          return state;
      }
    },
    { strokes: {}, positions: {} } as State,
  );

  useEffect(() => {
    if (!registerLobbyDrawingDispatch || !unregisterLobbyDrawingDispatch) return;
    const handler = (msg: any) => {
      if (msg?.type === 'drawing_update' && msg?.participant_id) {
        dispatch({
          type: 'drawing_update',
          participant_id: msg.participant_id,
          operation: msg.operation,
          data: msg.data,
        });
      }
    };
    registerLobbyDrawingDispatch(handler);
    return () => unregisterLobbyDrawingDispatch();
  }, [registerLobbyDrawingDispatch, unregisterLobbyDrawingDispatch]);

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

  const avatars = participants.filter((p) => p.avatar?.image);
  const defaults = useMemo(
    () => computeGridPositions(avatars.length, size.w, size.h, 128),
    [avatars.length, size.w, size.h],
  );

  return (
    <div className={styles.root}>
      <div className={styles.stageWrap} ref={containerRef}>
        <Stage width={size.w} height={size.h}>
          <Layer>
            {avatars.map((p, i) => {
              const ep = drawState.positions[p.id];
              const pos = ep || p.avatar?.position || defaults[i] || { x: 0, y: 0 };
              return (
                <AvatarSprite
                  key={p.id}
                  id={p.id}
                  src={p.avatar?.image || undefined}
                  x={pos.x}
                  y={pos.y}
                  size={128}
                />
              );
            })}
          </Layer>
          {/* Live strokes overlay */}
          <Layer>
            {Object.entries(drawState.strokes).flatMap(([pid, strokes]) =>
              strokes.map((s, idx) => (
                <Line
                  key={`${pid}-${idx}`}
                  points={s.points}
                  stroke={s.color}
                  strokeWidth={s.width}
                  lineCap="round"
                />
              )),
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
