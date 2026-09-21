import { useEffect, useState } from 'react';

import { Group, Image as KonvaImage, Layer, Rect, Stage } from 'react-konva';

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

function useAspect(url: string | null): { w: number; h: number } | null {
  const [aspect, setAspect] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    setAspect(null);
    if (!url) return;
    let cancelled = false;
    const img = new window.Image();
    img.addEventListener('load', () => {
      if (cancelled) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspect({ w: img.naturalWidth, h: img.naturalHeight });
      }
    });
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);
  return aspect;
}

// Reconstructs a group's photo by placing each submitted slice into its grid
// region. The canvas keeps the source photo's aspect so the regions tile it
// exactly; each slice was drawn at its region's aspect, so it fills its cell.
export default function CompositeCanvas({ composite, width }: CompositeCanvasProps) {
  const ordered = composite.slices.toSorted((a, b) => a.slice_index - b.slice_index);
  const images = useImages(ordered.map((s) => s.image));
  const sourceAspect = useAspect(composite.source_photo_url);

  const height = sourceAspect ? Math.round(width * (sourceAspect.h / sourceAspect.w)) : width;

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Rect x={0} y={0} width={width} height={height} fill="hsl(var(--muted))" />
        {ordered.map((slice, i) => {
          const img = images[i];
          const r = slice.region;
          const x = r.x * width;
          const y = r.y * height;
          const w = r.w * width;
          const h = r.h * height;
          return (
            <Group key={slice.slice_index}>
              {img && <KonvaImage image={img} x={x} y={y} width={w} height={h} />}
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                dash={[6, 6]}
              />
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}
