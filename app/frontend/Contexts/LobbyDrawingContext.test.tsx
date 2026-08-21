import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  LobbyDrawingProvider,
  useLobbyDrawingDispatch,
  useLobbyDrawingState,
} from './LobbyDrawingContext';

function useDrawing() {
  return {
    state: useLobbyDrawingState(),
    dispatch: useLobbyDrawingDispatch(),
  };
}

describe('LobbyDrawingContext reducer', () => {
  describe('stroke_started', () => {
    it('defaults points to [] when points is not an array', () => {
      const { result } = renderHook(useDrawing, { wrapper: LobbyDrawingProvider });

      act(() => {
        result.current.dispatch({
          type: 'drawing_update',
          participant_id: 'p1',
          operation: 'stroke_started',
          // SAFETY: intentionally passing a non-array points value to simulate
          // a malformed live message; the test verifies it defaults to [].
          data: { points: 'bad', color: '#f00', width: 4 } as never,
        });
      });

      expect(result.current.state.strokes['p1']).toHaveLength(1);
      expect(result.current.state.strokes['p1'][0].points).toEqual([]);
    });
  });

  describe('canvas_clear_undone', () => {
    it('stores only strokes that have a valid points array', () => {
      const { result } = renderHook(useDrawing, { wrapper: LobbyDrawingProvider });

      act(() => {
        result.current.dispatch({
          type: 'drawing_update',
          participant_id: 'p1',
          operation: 'canvas_clear_undone',
          data: {
            strokes: [
              { points: [10, 10, 20, 20], color: '#f00', width: 4 },
              // SAFETY: intentionally omitting `points` to represent a corrupt
              // stroke as it may arrive from legacy DB data; the test verifies
              // the reducer filters it before storing.
              { color: '#00f', width: 4 } as never,
            ],
          },
        });
      });

      expect(result.current.state.strokes['p1']).toHaveLength(1);
      expect(result.current.state.strokes['p1'][0].color).toBe('#f00');
    });

    it('stores an empty array when all strokes are corrupt', () => {
      const { result } = renderHook(useDrawing, { wrapper: LobbyDrawingProvider });

      act(() => {
        result.current.dispatch({
          type: 'drawing_update',
          participant_id: 'p1',
          operation: 'canvas_clear_undone',
          data: {
            // SAFETY: intentionally all corrupt to verify the reducer produces
            // an empty array rather than storing unrenderable data.
            strokes: [{ color: '#00f', width: 4 }] as never,
          },
        });
      });

      expect(result.current.state.strokes['p1']).toHaveLength(0);
    });
  });
});
