// Seconds a participant views the full source photo. Mirrors
// Experiences::Orchestrator::COLLABORATIVE_DRAWING_PREVIEW_SECONDS.
export const PREVIEW_SECONDS = 10;

// Seconds the assigned slice is highlighted before drawing begins. Mirrors
// Experiences::Orchestrator::COLLABORATIVE_DRAWING_MARKER_SECONDS.
export const MARKER_SECONDS = 10;

// The monitor counts down to "draw" over the same window participants preview.
export const MONITOR_COUNTDOWN_SECONDS = PREVIEW_SECONDS;

// The whole recreation is a fixed portrait frame (width : height); a slice is a
// full-width horizontal band of it, so slices get wider as the count grows.
export const COMPOSITE_WIDTH = 900;
export const COMPOSITE_HEIGHT = 1200;

export function sliceDrawSize(sliceCount: number) {
  const count = sliceCount > 0 ? sliceCount : 1;
  return { w: COMPOSITE_WIDTH, h: Math.round(COMPOSITE_HEIGHT / count) };
}

export type CollaborativeDrawingSubPhase = 'get_ready' | 'preview' | 'marker' | 'draw' | 'times_up';

export interface SubPhaseState {
  subPhase: CollaborativeDrawingSubPhase;
  // Seconds left in the current sub-phase (preview / marker / draw).
  phaseRemaining: number;
}
