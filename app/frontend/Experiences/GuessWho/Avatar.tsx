import { useMemo } from 'react';

import { Layer, Line, Stage } from 'react-konva';

import { DRAW_SIZE, cosmeticAssetUrl, sortCosmetics } from '@cctv/components/Cosmetics';
import { AvatarData, AvatarStroke } from '@cctv/types';

interface AvatarProps {
  avatar?: AvatarData | null;
  size?: number;
  className?: string;
}

// Fraction of the box kept clear around a legacy drawing so strokes don't touch
// the edges when fitted.
const PADDING_RATIO = 0.1;

interface IdentifiedStroke {
  id: string;
  stroke: AvatarStroke;
}

// Strokes carry no id, so identity comes from the drawn geometry plus an
// occurrence counter that keeps repeated identical marks distinct.
function identifyStrokes(strokes: AvatarStroke[]): IdentifiedStroke[] {
  const occurrences = new Map<string, number>();
  return strokes.map((stroke) => {
    const drawn = `${stroke.color}:${stroke.width}:${stroke.points.join(',')}`;
    const occurrence = occurrences.get(drawn) ?? 0;
    occurrences.set(drawn, occurrence + 1);
    return { id: `${drawn}#${occurrence}`, stroke };
  });
}

export default function Avatar({ avatar, size = 96, className }: AvatarProps) {
  const image = avatar?.image;
  const cosmetics = useMemo(() => avatar?.cosmetics ?? [], [avatar?.cosmetics]);
  const strokes = useMemo(() => avatar?.strokes ?? [], [avatar?.strokes]);
  const identified = useMemo(() => identifyStrokes(strokes), [strokes]);

  // Fit legacy stroke drawings to their bounding box (pre-flatten avatars).
  const fit = useMemo(() => {
    if (image || strokes.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxStroke = 0;

    for (const s of strokes) {
      maxStroke = Math.max(maxStroke, s.width ?? 0);
      const pts = s.points ?? [];
      for (let i = 0; i + 1 < pts.length; i += 2) {
        minX = Math.min(minX, pts[i]);
        maxX = Math.max(maxX, pts[i]);
        minY = Math.min(minY, pts[i + 1]);
        maxY = Math.max(maxY, pts[i + 1]);
      }
    }

    if (!Number.isFinite(minX)) return null;

    const half = maxStroke / 2;
    minX -= half;
    minY -= half;
    maxX += half;
    maxY += half;

    const bboxW = Math.max(maxX - minX, 1);
    const bboxH = Math.max(maxY - minY, 1);
    const inner = size * (1 - PADDING_RATIO * 2);
    const scale = inner / Math.max(bboxW, bboxH);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return {
      scale,
      offsetX: size / 2 - cx * scale,
      offsetY: size / 2 - cy * scale,
    };
  }, [image, strokes, size]);

  // Flattened avatar: fixed-size raster image plus the separate cosmetics layer.
  // No bbox-fit — every avatar renders at identical dimensions (whitespace kept).
  if (image) {
    const scale = size / DRAW_SIZE;
    return (
      <div className={className} style={{ position: 'relative', width: size, height: size }}>
        <img src={image} width={size} height={size} alt="" style={{ display: 'block' }} />
        {sortCosmetics(cosmetics).map((c) => {
          const url = cosmeticAssetUrl(c.asset_key);
          if (!url) return null;
          return (
            <img
              key={`${c.cosmetic_id}-${c.x}-${c.y}-${c.rotation}`}
              src={url}
              alt=""
              style={{
                position: 'absolute',
                left: c.x * scale,
                top: c.y * scale,
                width: c.width * scale,
                height: c.height * scale,
                transform: c.rotation ? `rotate(${c.rotation}deg)` : undefined,
                transformOrigin: 'center',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>
    );
  }

  if (strokes.length === 0 || !fit) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '14%',
          background: 'hsl(var(--muted) / 0.35)',
        }}
        aria-hidden
      />
    );
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Stage width={size} height={size}>
        <Layer x={fit.offsetX} y={fit.offsetY} scaleX={fit.scale} scaleY={fit.scale}>
          {identified.map(({ id, stroke }) => (
            <Line
              key={id}
              points={stroke.points}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
