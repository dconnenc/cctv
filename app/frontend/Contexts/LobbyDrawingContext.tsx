import { ReactNode, createContext, useContext, useReducer } from 'react';

import { CosmeticPlacement } from '@cctv/types';

type Stroke = { points: number[]; color: string; width: number; ended?: boolean };
type CommittedAvatar = { image: string; cosmetics: CosmeticPlacement[] };
type DrawingState = {
  strokes: { [participantId: string]: Stroke[] };
  committed: { [participantId: string]: CommittedAvatar };
};

type DrawingData =
  | { operation: 'clear_all' }
  | {
      operation: 'avatar_committed';
      data?: { strokes?: Stroke[]; image?: string; cosmetics?: CosmeticPlacement[] };
    }
  | { operation: 'canvas_cleared' }
  | { operation: 'stroke_started'; data?: { points: number[]; color: string; width: number } }
  | { operation: 'stroke_points_appended'; data?: { points: number[] } }
  | { operation: 'stroke_ended' }
  | { operation: 'stroke_undone' }
  | { operation: 'canvas_clear_undone'; data?: { strokes: Stroke[] } };

export type DrawingAction = { type: 'drawing_update'; participant_id: string } & DrawingData;

function withoutKey<T>(map: { [k: string]: T }, key: string) {
  const next = { ...map };
  delete next[key];
  return next;
}

function reducer(state: DrawingState, action: DrawingAction): DrawingState {
  const { participant_id, operation } = action;
  const existing = state.strokes[participant_id] || [];

  switch (operation) {
    case 'clear_all':
      return { strokes: {}, committed: {} };
    case 'avatar_committed':
      // Flattened avatar: image + cosmetics replace any live strokes.
      if (action.data?.image !== undefined) {
        return {
          strokes: withoutKey(state.strokes, participant_id),
          committed: {
            ...state.committed,
            [participant_id]: {
              image: action.data.image,
              cosmetics: action.data.cosmetics ?? [],
            },
          },
        };
      }
      // Legacy stroke-based commit.
      return {
        ...state,
        strokes: { ...state.strokes, [participant_id]: action.data?.strokes || [] },
      };
    case 'canvas_cleared':
      return {
        strokes: withoutKey(state.strokes, participant_id),
        committed: withoutKey(state.committed, participant_id),
      };
    case 'stroke_started': {
      const stroke: Stroke = {
        points: action.data?.points || [],
        color: action.data?.color || '#000',
        width: action.data?.width || 4,
      };
      // A fresh stroke means the participant is (re)drawing; drop any finalized image.
      return {
        strokes: { ...state.strokes, [participant_id]: [...existing, stroke] },
        committed: withoutKey(state.committed, participant_id),
      };
    }
    case 'stroke_points_appended': {
      if (existing.length === 0) return state;
      const next = existing.slice();
      const s = { ...next[next.length - 1] };
      s.points = [...s.points, ...(action.data?.points || [])];
      next[next.length - 1] = s;
      return { ...state, strokes: { ...state.strokes, [participant_id]: next } };
    }
    case 'stroke_ended': {
      if (existing.length === 0) return state;
      const next = existing.slice();
      const last = { ...next[next.length - 1], ended: true };
      if (last.points.length === 2) {
        last.points = [...last.points, last.points[0], last.points[1]];
      }
      next[next.length - 1] = last;
      return { ...state, strokes: { ...state.strokes, [participant_id]: next } };
    }
    case 'stroke_undone': {
      if (existing.length === 0) return state;
      return { ...state, strokes: { ...state.strokes, [participant_id]: existing.slice(0, -1) } };
    }
    case 'canvas_clear_undone': {
      return {
        ...state,
        strokes: { ...state.strokes, [participant_id]: action.data?.strokes || [] },
      };
    }
    default:
      return state;
  }
}

const LobbyDrawingStateContext = createContext<DrawingState | undefined>(undefined);
const LobbyDrawingDispatchContext = createContext<((action: DrawingAction) => void) | undefined>(
  undefined,
);

export function LobbyDrawingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { strokes: {}, committed: {} });
  return (
    <LobbyDrawingStateContext.Provider value={state}>
      <LobbyDrawingDispatchContext.Provider value={dispatch}>
        {children}
      </LobbyDrawingDispatchContext.Provider>
    </LobbyDrawingStateContext.Provider>
  );
}

export function useLobbyDrawingState(): DrawingState {
  const ctx = useContext(LobbyDrawingStateContext);
  if (!ctx) throw new Error('useLobbyDrawingState must be used within LobbyDrawingProvider');
  return ctx;
}

export function useLobbyDrawingDispatch(): (action: DrawingAction) => void {
  const ctx = useContext(LobbyDrawingDispatchContext);
  if (!ctx) throw new Error('useLobbyDrawingDispatch must be used within LobbyDrawingProvider');
  return ctx;
}
