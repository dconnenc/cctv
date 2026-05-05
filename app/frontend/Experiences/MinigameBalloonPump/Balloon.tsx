import { useEffect, useRef } from 'react';

interface BalloonProps {
  fillRatio: number;
  popped?: boolean;
  size?: number;
  color?: string;
}

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.05;

export default function Balloon({
  fillRatio,
  popped = false,
  size = 240,
  color = '#ff4911',
}: BalloonProps) {
  const lastFillRef = useRef(0);
  const wobbleRef = useRef(0);

  useEffect(() => {
    const delta = fillRatio - lastFillRef.current;
    if (delta > 0.005) {
      wobbleRef.current = Date.now();
    }
    lastFillRef.current = fillRatio;
  }, [fillRatio]);

  const eased = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * Math.min(1, fillRatio);
  const wobbleAge = Date.now() - wobbleRef.current;
  const wobble = wobbleAge < 400 ? Math.sin(wobbleAge / 28) * (1 - wobbleAge / 400) * 0.04 : 0;
  const scaleX = eased * (1 + wobble);
  const scaleY = eased * (1 - wobble * 0.6);

  if (popped) {
    return <PoppedBalloon size={size} color={color} />;
  }

  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="balloonGrad" cx="-0.2" cy="-0.3" r="1">
          <stop offset="0%" stopColor={lighten(color, 0.45)} />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={darken(color, 0.25)} />
        </radialGradient>
      </defs>
      <g transform={`scale(${scaleX} ${scaleY})`}>
        <path d="M 0 70 L -3 76 L 3 76 Z" fill={darken(color, 0.4)} />
        <ellipse cx="0" cy="0" rx="60" ry="72" fill="url(#balloonGrad)" />
        <ellipse cx="-22" cy="-28" rx="14" ry="22" fill="rgba(255,255,255,0.35)" />
        <ellipse cx="0" cy="74" rx="6" ry="4" fill={darken(color, 0.4)} />
      </g>
      <line
        x1="0"
        y1={76 * scaleY}
        x2="-2"
        y2={(76 + 60) * scaleY}
        stroke="#3a3a3a"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function PoppedBalloon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200">
      <g>
        {[...Array(14)].map((_, i) => {
          const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
          const dist = 60 + Math.random() * 40;
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          return (
            <path
              key={i}
              d={`M ${x.toFixed(1)} ${y.toFixed(1)} l ${(Math.random() * 12 - 6).toFixed(1)} ${(Math.random() * 12 - 6).toFixed(1)}`}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </svg>
  );
}

function lighten(hex: string, amount: number): string {
  return mixHex(hex, '#ffffff', amount);
}

function darken(hex: string, amount: number): string {
  return mixHex(hex, '#000000', amount);
}

function mixHex(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const r = Math.round(a.r + (b.r - a.r) * amount);
  const g = Math.round(a.g + (b.g - a.g) * amount);
  const bl = Math.round(a.b + (b.b - a.b) * amount);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const stripped = hex.replace('#', '');
  const expanded =
    stripped.length === 3
      ? stripped
          .split('')
          .map((c) => c + c)
          .join('')
      : stripped;
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}
