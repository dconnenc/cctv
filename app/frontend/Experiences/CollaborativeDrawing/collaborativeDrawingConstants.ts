// Seconds a participant views the full source photo before drawing. Mirrors
// Experiences::Orchestrator::COLLABORATIVE_DRAWING_PREVIEW_SECONDS.
export const PREVIEW_SECONDS = 10;

// Seconds for the slice marker highlight + rotate-to-landscape animation.
// Mirrors Experiences::Orchestrator::COLLABORATIVE_DRAWING_MARKER_SECONDS.
export const MARKER_SECONDS = 3;

// The monitor counts down to "draw" over the same window participants preview.
export const MONITOR_COUNTDOWN_SECONDS = PREVIEW_SECONDS;

// Fixed coordinate width of a single slice's (square) drawing space. Each
// submitted slice is a flattened square image; the composite stacks them.
export const SLICE_DRAW_WIDTH = 900;

export type CollaborativeDrawingSubPhase = 'get_ready' | 'preview' | 'marker' | 'draw' | 'times_up';

export interface SubPhaseState {
  subPhase: CollaborativeDrawingSubPhase;
  drawRemaining: number;
}
