import { DRAW_SIZE, cosmeticAssetUrl, sortCosmetics } from '@cctv/components/Cosmetics';
import type { AvatarData } from '@cctv/types';

export const SPRITE_SIZE = 160;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => resolve(null));
    image.src = src;
  });
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

/**
 * Pre-renders an avatar into a circular sprite so the game loop draws each
 * player with a single drawImage. Flattened avatars draw their image plus
 * cosmetics; legacy stroke avatars replay their strokes; avatar-less players
 * get their initials on a tinted disc.
 */
export async function buildAvatarSprite(
  avatar: AvatarData | null | undefined,
  name: string,
  tint: string,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const half = SPRITE_SIZE / 2;
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  const scale = SPRITE_SIZE / DRAW_SIZE;

  if (avatar?.image) {
    const image = await loadImage(avatar.image);
    if (image) ctx.drawImage(image, 0, 0, SPRITE_SIZE, SPRITE_SIZE);

    const placements = sortCosmetics(avatar.cosmetics ?? []);
    const arts = await Promise.all(
      placements.map((placement) => {
        const url = cosmeticAssetUrl(placement.asset_key);
        return url ? loadImage(url) : Promise.resolve(null);
      }),
    );
    placements.forEach((placement, index) => {
      const art = arts[index];
      if (!art) return;
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(placement.x + placement.width / 2, placement.y + placement.height / 2);
      ctx.rotate((placement.rotation * Math.PI) / 180);
      ctx.drawImage(
        art,
        -placement.width / 2,
        -placement.height / 2,
        placement.width,
        placement.height,
      );
      ctx.restore();
    });
    return canvas;
  }

  if (avatar?.strokes?.length) {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of avatar.strokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      for (let i = 0; i + 1 < stroke.points.length; i += 2) {
        if (i === 0) ctx.moveTo(stroke.points[i], stroke.points[i + 1]);
        else ctx.lineTo(stroke.points[i], stroke.points[i + 1]);
      }
      ctx.stroke();
    }
    ctx.restore();
    return canvas;
  }

  ctx.fillStyle = 'rgba(8, 8, 8, 0.75)';
  ctx.font = `${Math.round(SPRITE_SIZE * 0.38)}px 'Bebas Neue', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials(name), half, half + SPRITE_SIZE * 0.03);
  return canvas;
}
