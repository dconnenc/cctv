import { ReactNode, createContext, useContext, useReducer } from 'react';

type Stroke = { points: number[]; color: string; width: number; ended?: boolean };
type DrawingState = { strokes: { [participantId: string]: Stroke[] } };

type DrawingData =
  | { operation: 'clear_all' }
  | { operation: 'avatar_committed'; data?: { strokes: Stroke[] } }
  | { operation: 'canvas_cleared' }
  | { operation: 'stroke_started'; data?: { points: number[]; color: string; width: number } }
  | { operation: 'stroke_points_appended'; data?: { points: number[] } }
  | { operation: 'stroke_ended' }
  | { operation: 'stroke_undone' }
  | { operation: 'canvas_clear_undone'; data?: { strokes: Stroke[] } };

export type DrawingAction = { type: 'drawing_update'; participant_id: string } & DrawingData;

function reducer(state: DrawingState, action: DrawingAction): DrawingState {
  const { participant_id, operation } = action;
  const existing = state.strokes[participant_id] || [];

  switch (operation) {
    case 'clear_all':
      return { strokes: {} };
    case 'avatar_committed':
      return { strokes: { ...state.strokes, [participant_id]: action.data?.strokes || [] } };
    case 'canvas_cleared': {
      const next = { ...state.strokes };
      delete next[participant_id];
      return { strokes: next };
    }
    case 'stroke_started': {
      const stroke: Stroke = {
        points: action.data?.points || [],
        color: action.data?.color || '#000',
        width: action.data?.width || 4,
      };
      return { strokes: { ...state.strokes, [participant_id]: [...existing, stroke] } };
    }
    case 'stroke_points_appended': {
      if (existing.length === 0) return state;
      const next = existing.slice();
      const s = { ...next[next.length - 1] };
      s.points = [...s.points, ...(action.data?.points || [])];
      next[next.length - 1] = s;
      return { strokes: { ...state.strokes, [participant_id]: next } };
    }
    case 'stroke_ended': {
      if (existing.length === 0) return state;
      const next = existing.slice();
      const last = { ...next[next.length - 1], ended: true };
      if (last.points.length === 2) {
        last.points = [...last.points, last.points[0], last.points[1]];
      }
      next[next.length - 1] = last;
      return { strokes: { ...state.strokes, [participant_id]: next } };
    }
    case 'stroke_undone': {
      if (existing.length === 0) return state;
      return { strokes: { ...state.strokes, [participant_id]: existing.slice(0, -1) } };
    }
    case 'canvas_clear_undone': {
      return {
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
  const [state, dispatch] = useReducer(reducer, { strokes: {} });
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
