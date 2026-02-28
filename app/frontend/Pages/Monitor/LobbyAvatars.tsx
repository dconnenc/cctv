import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { Group, Layer, Line, Stage } from 'react-konva';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { AvatarStroke, DrawingUpdateMessage, ExperienceParticipant } from '@cctv/types';

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
  const { monitorView, registerLobbyDrawingDispatch, unregisterLobbyDrawingDispatch } =
    useExperience();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 960, h: 540 });

  type Stroke = { points: number[]; color: string; width: number; ended?: boolean };
  type State = {
    strokes: { [participantId: string]: Stroke[] };
  };
  type DrawingData =
    | { operation: 'clear_all' }
    | { operation: 'stroke_started'; data?: { points: number[]; color: string; width: number } }
    | { operation: 'stroke_points_appended'; data?: { points: number[] } }
    | { operation: 'stroke_ended' };
  type Action =
    | { type: 'reset' }
    | ({ type: 'drawing_update'; participant_id: string } & DrawingData);

  const [drawState, dispatch] = useReducer(
    (state: State, action: Action): State => {
      switch (action.type) {
        case 'reset':
          return { strokes: {} };
        case 'drawing_update': {
          const { participant_id, operation } = action;
          console.log('drawing updated: ', participant_id, operation);
          console.log('action.data: ', action.data);
          const existing = state.strokes[participant_id] || [];
          console.log('existing strokes count: ', existing.length);
          switch (operation) {
            case 'clear_all':
              return { strokes: {} };
            case 'stroke_started': {
              const stroke: Stroke = {
                points: action.data?.points || [],
                color: action.data?.color || '#000',
                width: action.data?.width || 4,
              };
              return {
                strokes: { ...state.strokes, [participant_id]: [...existing, stroke] },
              };
            }
            case 'stroke_points_appended': {
              const next = existing.slice();
              if (next.length === 0) {
                console.log('ERROR: stroke_points_appended but no existing strokes!');
                return state;
              }
              const s = { ...next[next.length - 1] };
              console.log('Before append - points count:', s.points.length);
              console.log('Points to append:', action.data?.points);
              s.points = [...s.points, ...(action.data?.points || [])];
              console.log('After append - points count:', s.points.length);
              next[next.length - 1] = s;
              return {
                strokes: { ...state.strokes, [participant_id]: next },
              };
            }
            case 'stroke_ended': {
              const next = existing.slice();
              if (next.length === 0) return state;
              const s = { ...next[next.length - 1], ended: true };
              next[next.length - 1] = s;
              return {
                strokes: { ...state.strokes, [participant_id]: next },
              };
            }
            default:
              return state;
          }
        }
        default:
          return state;
      }
    },
    { strokes: {} } as State,
  );

  useEffect(() => {
    if (!registerLobbyDrawingDispatch || !unregisterLobbyDrawingDispatch) return;
    const handler = (msg: DrawingUpdateMessage) => {
      dispatch({
        type: 'drawing_update',
        participant_id: msg.participant_id,
        operation: msg.operation,
        data: msg.data,
      } as Action);
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

  const avatarScale = AVATAR_DISPLAY_SIZE / DRAW_SIZE;

  return (
    <div className={styles.root}>
      <div className={styles.stageWrap} ref={containerRef}>
        <Stage width={size.w} height={size.h}>
          <Layer>
            {participants.map((p) => {
              // Prefer live strokes (participant is actively drawing); fall back to committed.
              console.log('DRAWING');
              const strokes: AvatarStroke[] =
                (drawState.strokes[p.id]?.length ? drawState.strokes[p.id] : p.avatar?.strokes) ??
                [];

              console.log(p.name);
              console.log(drawState.strokes[p.id]);
              console.log(p.avatar?.strokes);
              console.log('Strokes: ', strokes);
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
