import { FRAME_ORIGIN_LAT, FRAME_ORIGIN_LNG, FRAME_ZOOM } from './chicago-geometry';

const TILE_SIZE = 256;
const WORLD_SIZE = TILE_SIZE * 2 ** FRAME_ZOOM;

export interface FramePoint {
  x: number;
  y: number;
}

function worldX(lng: number): number {
  return ((lng + 180) / 360) * WORLD_SIZE;
}

function worldY(lat: number): number {
  const radians = (lat * Math.PI) / 180;
  const mercator = Math.log(Math.tan(radians) + 1 / Math.cos(radians));
  return (0.5 - mercator / (2 * Math.PI)) * WORLD_SIZE;
}

const ORIGIN_X = worldX(FRAME_ORIGIN_LNG);
const ORIGIN_Y = worldY(FRAME_ORIGIN_LAT);

/** Web Mercator lat/lng to pixels in the baked frame's coordinate space. */
export function projectToFrame(lat: number, lng: number): FramePoint {
  return { x: worldX(lng) - ORIGIN_X, y: worldY(lat) - ORIGIN_Y };
}
