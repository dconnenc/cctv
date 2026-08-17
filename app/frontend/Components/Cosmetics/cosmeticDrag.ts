import { Cosmetic } from '@cctv/types';

export const COSMETIC_DRAG_MIME = 'application/x-cctv-cosmetic';

export function setCosmeticDragData(dataTransfer: DataTransfer, cosmetic: Cosmetic) {
  dataTransfer.setData(COSMETIC_DRAG_MIME, JSON.stringify(cosmetic));
  dataTransfer.effectAllowed = 'copy';
}

export function getCosmeticDragData(dataTransfer: DataTransfer): Cosmetic | null {
  const raw = dataTransfer.getData(COSMETIC_DRAG_MIME);
  if (!raw) return null;
  try {
    // SAFETY: the payload was serialized by setCosmeticDragData from a Cosmetic;
    // a malformed value throws and is caught below.
    return JSON.parse(raw) as Cosmetic;
  } catch {
    return null;
  }
}
