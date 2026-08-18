import { Cosmetic, CosmeticCategory, CosmeticPlacement } from '@cctv/types';

// The fixed drawing/coordinate space. Cosmetic placements are stored in this
// space and scaled uniformly (size / DRAW_SIZE) wherever an avatar is rendered.
export const DRAW_SIZE = 320;

// Builds a placement for a cosmetic. Clothing is centered on (centerX, centerY)
// at its default size; a frame ignores the drop point and fills the canvas.
export function placementFromCosmetic(
  cosmetic: Cosmetic,
  centerX: number,
  centerY: number,
): CosmeticPlacement {
  if (cosmetic.category === 'frame') {
    return {
      cosmetic_id: cosmetic.id,
      slug: cosmetic.slug,
      asset_key: cosmetic.asset_key,
      category: 'frame',
      x: 0,
      y: 0,
      width: DRAW_SIZE,
      height: DRAW_SIZE,
      rotation: 0,
    };
  }

  const { width, height, rotation } = cosmetic.default_placement;
  return {
    cosmetic_id: cosmetic.id,
    slug: cosmetic.slug,
    asset_key: cosmetic.asset_key,
    category: 'clothing',
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    rotation,
  };
}

// Frames render on top of clothing. Stable-sorts so clothing keeps its order.
export function sortCosmetics<T extends { category: CosmeticCategory }>(placements: T[]): T[] {
  return placements.toSorted(
    (a, b) => (a.category === 'frame' ? 1 : 0) - (b.category === 'frame' ? 1 : 0),
  );
}

// Adds a cosmetic to the current placements: clothing is appended; a frame
// replaces any existing frame (one at a time).
export function applyCosmetic(
  existing: CosmeticPlacement[],
  cosmetic: Cosmetic,
  centerX: number,
  centerY: number,
): CosmeticPlacement[] {
  const placement = placementFromCosmetic(cosmetic, centerX, centerY);
  if (placement.category === 'frame') {
    return [...existing.filter((p) => p.category !== 'frame'), placement];
  }
  return [...existing, placement];
}

// Bundled cosmetic art, keyed by the `asset_key` stored on the Cosmetic record.
// Each entry is an inline SVG so it can be rendered as an <img> (inventory,
// avatar overlay) and loaded into a Konva image (drawing canvas) from one source.
const COSMETIC_SVGS = new Map<string, string>([
  [
    'hat',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 96">
    <ellipse cx="60" cy="80" rx="56" ry="12" fill="#141414"/>
    <rect x="30" y="12" width="60" height="62" rx="5" fill="#1c1c1c"/>
    <rect x="30" y="56" width="60" height="12" fill="#8a2433"/>
    <ellipse cx="60" cy="13" rx="30" ry="7" fill="#242424"/>
  </svg>`,
  ],
  [
    'sunglasses',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 60">
    <path d="M10 20 L2 13" stroke="#141414" stroke-width="4" stroke-linecap="round"/>
    <path d="M130 20 L138 13" stroke="#141414" stroke-width="4" stroke-linecap="round"/>
    <path d="M56 22 Q70 12 84 22" fill="none" stroke="#141414" stroke-width="4"/>
    <rect x="8" y="16" width="50" height="34" rx="13" fill="#0b0b0b" stroke="#141414" stroke-width="3"/>
    <rect x="82" y="16" width="50" height="34" rx="13" fill="#0b0b0b" stroke="#141414" stroke-width="3"/>
    <path d="M16 24 L28 22" stroke="#c8f060" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
    <path d="M90 24 L102 22" stroke="#c8f060" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  </svg>`,
  ],
  // Inset outline (not clipped by the 320 window) with a cursive "Beta Tester"
  // signature straddling the bottom edge as if part of the frame.
  [
    'beta_tester_frame',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
    <rect x="16" y="16" width="288" height="288" rx="16" fill="none" stroke="#c8f060" stroke-width="4"/>
    <rect x="24" y="24" width="272" height="272" rx="11" fill="none" stroke="#c8f060" stroke-width="1.5" opacity="0.55"/>
    <path d="M16 44 L16 16 L44 16" fill="none" stroke="#f0ede4" stroke-width="3"/>
    <path d="M304 276 L304 304 L276 304" fill="none" stroke="#f0ede4" stroke-width="3"/>
    <text x="104" y="306" transform="rotate(-7 104 306)"
      font-family="'Brush Script MT','Snell Roundhand','Segoe Script',cursive"
      font-size="34" fill="#c8f060" stroke="#080808" stroke-width="0.6"
      paint-order="stroke">Beta Tester</text>
  </svg>`,
  ],
]);

// Returns a data URL for the given asset_key, or null if unknown.
export function cosmeticAssetUrl(assetKey: string): string | null {
  const svg = COSMETIC_SVGS.get(assetKey);
  if (!svg) return null;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
