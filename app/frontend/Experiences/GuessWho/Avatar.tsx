import { useMemo } from 'react';

import { Layer, Line, Stage } from 'react-konva';

import { AvatarStroke } from '@cctv/types';

interface AvatarProps {
  strokes?: AvatarStroke[] | null;
  size?: number;
  className?: string;
}

// Fraction of the box kept clear around the drawing so strokes don't touch the
// edges when fitted.
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

export default function Avatar({ strokes, size = 96, className }: AvatarProps) {
  const list = useMemo(() => strokes ?? [], [strokes]);
  const identified = useMemo(() => identifyStrokes(list), [list]);

  // Fit the drawing to its own bounding box so it fills the avatar area instead
  // of floating tiny in a corner of the 400x400 drawing space.
  const fit = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxStroke = 0;

    for (const s of list) {
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
  }, [list, size]);

  if (list.length === 0 || !fit) {
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
