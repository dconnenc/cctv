import { useEffect, useState } from 'react';

import { Group, Image as KonvaImage, Layer, Line, Rect, Stage } from 'react-konva';

import { CollaborativeDrawingComposite } from '@cctv/types';

interface CompositeCanvasProps {
  composite: CollaborativeDrawingComposite;
  width: number;
}

function useImages(urls: (string | null)[]): (HTMLImageElement | null)[] {
  const [images, setImages] = useState<(HTMLImageElement | null)[]>(() => urls.map(() => null));

  useEffect(() => {
    let cancelled = false;
    const loaded: (HTMLImageElement | null)[] = urls.map(() => null);
    urls.forEach((url, i) => {
      if (!url) return;
      const img = new window.Image();
      img.addEventListener('load', () => {
        if (cancelled) return;
        loaded[i] = img;
        setImages([...loaded]);
      });
      img.src = url;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join('|')]);

  return images;
}

// Stacks a group's submitted slices, in slice order, into the recreation. Each
// slice is a full-width band whose height comes from the drawing's own aspect
// (all slices of a group share the source aspect), so the stack reconstructs
// the original image proportions.
export default function CompositeCanvas({ composite, width }: CompositeCanvasProps) {
  const ordered = composite.slices.toSorted((a, b) => a.slice_index - b.slice_index);
  const sliceCount = composite.slice_count ?? ordered.length ?? 1;
  const images = useImages(ordered.map((s) => s.image));

  // Uniform band height derived from the first loaded slice's aspect; until any
  // load resolves, fall back to a square-ish band so layout stays stable.
  const loaded = images.find((img) => img && img.naturalWidth > 0) ?? null;
  const bandHeight = loaded
    ? Math.round(width * (loaded.naturalHeight / loaded.naturalWidth))
    : Math.round(width / sliceCount);
  const stageHeight = bandHeight * sliceCount;

  return (
    <Stage width={width} height={stageHeight}>
      <Layer>
        <Rect x={0} y={0} width={width} height={stageHeight} fill="hsl(var(--muted))" />
        {ordered.map((slice, i) => {
          const img = images[i];
          const y = i * bandHeight;
          return (
            <Group key={slice.slice_index}>
              {img && <KonvaImage image={img} x={0} y={y} width={width} height={bandHeight} />}
              {i > 0 && (
                <Line
                  points={[0, y, width, y]}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                  dash={[6, 6]}
                />
              )}
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}
