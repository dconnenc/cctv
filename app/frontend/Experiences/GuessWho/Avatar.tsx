import { Layer, Line, Stage } from 'react-konva';

import { AvatarStroke } from '@cctv/types';

interface AvatarProps {
  strokes?: AvatarStroke[] | null;
  size?: number;
  className?: string;
}

export default function Avatar({ strokes, size = 96, className }: AvatarProps) {
  const list = strokes ?? [];
  const scale = size / 400;

  if (list.length === 0) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'hsl(var(--muted))',
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'hsl(var(--muted))',
      }}
    >
      <Stage width={size} height={size}>
        <Layer scaleX={scale} scaleY={scale}>
          {list.map((s, i) => (
            <Line
              key={i}
              points={s.points}
              stroke={s.color}
              strokeWidth={s.width}
              lineCap="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
