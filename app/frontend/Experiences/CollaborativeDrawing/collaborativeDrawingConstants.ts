import { CollaborativeDrawingRegion } from '@cctv/types';

// Seconds a participant views the full source photo. Mirrors
// Experiences::Orchestrator::COLLABORATIVE_DRAWING_PREVIEW_SECONDS.
export const PREVIEW_SECONDS = 10;

// Seconds the assigned slice is highlighted before drawing begins. Mirrors
// Experiences::Orchestrator::COLLABORATIVE_DRAWING_MARKER_SECONDS.
export const MARKER_SECONDS = 10;

// The monitor counts down to "draw" over the same window participants preview.
export const MONITOR_COUNTDOWN_SECONDS = PREVIEW_SECONDS;

// How often the drawing canvas auto-persists while a participant draws, so the
// latest canvas is captured without anyone needing to tap submit.
export const AUTOSAVE_INTERVAL_MS = 4000;

// Mirrors ExperienceCollaborativeDrawingAssignment.grid_region: slices tile the
// photo as an as-square-as-possible grid (2 → top/bottom, 3 → one on top and two
// below, 4 → 2x2, …), mapped in row-major order. Regions are fractional (0–1).
export function gridRegion(sliceIndex: number, sliceCount: number): CollaborativeDrawingRegion {
  const count = Math.max(1, Math.trunc(sliceCount));
  const index = Math.min(Math.max(0, Math.trunc(sliceIndex)), count - 1);
  const rows = Math.ceil(Math.sqrt(count));
  const base = Math.floor(count / rows);
  const remainder = count % rows;
  const rowSizes = Array.from({ length: rows }, (_, r) => (r < rows - remainder ? base : base + 1));

  let row = 0;
  let col = index;
  for (let r = 0; r < rows; r += 1) {
    if (col < rowSizes[r]) {
      row = r;
      break;
    }
    col -= rowSizes[r];
  }
  const cols = rowSizes[row];

  return { x: col / cols, y: row / rows, w: 1 / cols, h: 1 / rows };
}

export type CollaborativeDrawingSubPhase = 'get_ready' | 'preview' | 'marker' | 'draw' | 'times_up';

export interface SubPhaseState {
  subPhase: CollaborativeDrawingSubPhase;
  // Seconds left in the current sub-phase (preview / marker / draw).
  phaseRemaining: number;
}
