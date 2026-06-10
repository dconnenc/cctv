export const MIN_SYNTHETIC_COUNT = 1;
export const MAX_SYNTHETIC_COUNT = 200;
export const DEFAULT_SYNTHETIC_COUNT = 50;

export function clampSyntheticCount(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return DEFAULT_SYNTHETIC_COUNT;
  return Math.min(MAX_SYNTHETIC_COUNT, Math.max(MIN_SYNTHETIC_COUNT, Math.round(value)));
}
