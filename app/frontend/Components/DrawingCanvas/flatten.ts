import { AvatarStroke } from '@cctv/types';

// Rasterizes stroke data into a fixed-size PNG data URL. Strokes are stored in
// the same coordinate space as `size` (the 320x320 draw space), so they map 1:1.
// Every avatar is flattened to identical dimensions for predictable sizing. An
// optional background fill is painted below the strokes and baked into the PNG.
export function flattenStrokesToDataUrl(
  strokes: AvatarStroke[],
  size = 320,
  backgroundColor?: string | null,
  baseImage?: HTMLImageElement | null,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    return '';
  }
  if (!ctx) return '';

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  // A previously flattened avatar (drawing + its own background) sits below the
  // new strokes so re-editing keeps prior work.
  if (baseImage) {
    try {
      ctx.drawImage(baseImage, 0, 0, size, size);
    } catch {
      // ignore images that fail to draw (e.g. not fully decoded)
    }
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    const pts = stroke.points;
    if (!pts || pts.length < 2) continue;

    // A tap produces a degenerate stroke; render it as a dot.
    const degenerate = pts.every((v, i) => v === pts[i % 2]);
    if (degenerate) {
      ctx.beginPath();
      ctx.fillStyle = stroke.color;
      ctx.arc(pts[0], pts[1], Math.max(stroke.width / 2, 0.5), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i + 1 < pts.length; i += 2) {
      ctx.lineTo(pts[i], pts[i + 1]);
    }
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}
