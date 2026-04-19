import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react';

import * as THREE from 'three';
import * as Tone from 'tone';

import styles from './TicketRip.module.scss';

const PAPER_DK = '#dcd7c2';

interface TicketColors {
  paper: string;
  ink: string;
  phosphor: string;
}

function resolveCssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function resolveTicketColors(): TicketColors {
  return {
    paper: resolveCssVar('--hot-white', '#f0ede4'),
    ink: resolveCssVar('--black', '#080808'),
    phosphor: resolveCssVar('--phosphor', '#c8f060'),
  };
}

const FONT_LINK_ID = 'cctv-ticket-fonts';

function ensureFontsLoaded(): Promise<FontFaceSet | void> {
  if (!document.getElementById(FONT_LINK_ID)) {
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=IBM+Plex+Mono:wght@500;700&family=Fraunces:ital,wght@0,400;0,700;1,400&family=Dela+Gothic+One&display=swap';
    document.head.appendChild(link);
  }
  return document.fonts ? document.fonts.ready : Promise.resolve();
}

function drawPaperGrain(ctx: CanvasRenderingContext2D, W: number, H: number) {
  for (let i = 0; i < (W * H) / 400; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const a = Math.random() * 0.09;
    ctx.fillStyle = `rgba(30, 28, 20, ${a})`;
    ctx.fillRect(x, y, 1 + Math.random() * 1.3, 1);
  }
  for (let i = 0; i < 5; i++) {
    const g = ctx.createRadialGradient(
      Math.random() * W,
      Math.random() * H,
      0,
      Math.random() * W,
      Math.random() * H,
      120 + Math.random() * 200,
    );
    g.addColorStop(0, 'rgba(120, 110, 80, 0.06)');
    g.addColorStop(1, 'rgba(120, 110, 80, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

function punchCornerNotches(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  radius: number,
  corners: { tl?: boolean; tr?: boolean; bl?: boolean; br?: boolean },
) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  if (corners.tl) ctx.arc(0, 0, radius, 0, Math.PI * 2);
  if (corners.tr) {
    ctx.moveTo(W + radius, 0);
    ctx.arc(W, 0, radius, 0, Math.PI * 2);
  }
  if (corners.bl) {
    ctx.moveTo(radius, H);
    ctx.arc(0, H, radius, 0, Math.PI * 2);
  }
  if (corners.br) {
    ctx.moveTo(W + radius, H);
    ctx.arc(W, H, radius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function drawPerfDots(ctx: CanvasRenderingContext2D, y: number, W: number, ink: string) {
  ctx.fillStyle = ink;
  for (let x = 18; x < W - 18; x += 24) {
    ctx.beginPath();
    ctx.arc(x, y, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAdmitOneBand(
  ctx: CanvasRenderingContext2D,
  H: number,
  bandX: number,
  colors: TicketColors,
) {
  ctx.fillStyle = colors.phosphor;
  ctx.fillRect(0, 0, bandX, H);

  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(bandX, 24);
  ctx.lineTo(bandX, H - 24);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.save();
  ctx.translate(bandX / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 36px "Alfa Slab One", Georgia, serif';
  ctx.fillText('ADMIT ONE', 0, 0);
  ctx.restore();
}

function createTopHalfTexture(experienceName: string, colors: TicketColors): THREE.CanvasTexture {
  const W = 700;
  const H = 1120;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, colors.paper);
  bg.addColorStop(1, PAPER_DK);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawPaperGrain(ctx, W, H);

  const bandX = 82;
  drawAdmitOneBand(ctx, H, bandX, colors);

  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(bandX + 20, 24, W - bandX - 44, H - 48);
  ctx.lineWidth = 1;
  ctx.strokeRect(bandX + 30, 34, W - bandX - 64, H - 68);

  const contentLeft = bandX + 48;
  const contentRight = W - 48;
  const contentCenter = (contentLeft + contentRight) / 2;
  const contentWidth = contentRight - contentLeft;

  const headerTop = 60;
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '700 26px "Bebas Neue", Impact, sans-serif';
  ctx.fillText('★  CCTV  ★', contentCenter, headerTop);
  ctx.font = '500 14px "Bebas Neue", Impact, sans-serif';
  ctx.fillText('CHICAGO COMEDY TV', contentCenter, headerTop + 34);

  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(contentLeft + 60, headerTop + 64);
  ctx.lineTo(contentRight - 60, headerTop + 64);
  ctx.stroke();

  const showName = (experienceName || 'The Show').trim();

  const titleAreaTop = headerTop + 90;
  const titleAreaBottom = H - 60;
  const titleAreaHeight = titleAreaBottom - titleAreaTop;
  const titleAreaCenterY = (titleAreaTop + titleAreaBottom) / 2;

  const dateColWidth = 110;
  const columnGap = 14;
  const titleColWidth = contentWidth - dateColWidth - columnGap;
  const titleColCenterX = contentLeft + titleColWidth / 2;
  const dateColCenterX = contentRight - dateColWidth / 2;
  const dividerX = contentLeft + titleColWidth + columnGap / 2;

  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.moveTo(dividerX, titleAreaTop);
  ctx.lineTo(dividerX, titleAreaBottom);
  ctx.stroke();
  ctx.setLineDash([]);

  const titleFontFamily = '"Alfa Slab One", Georgia, serif';
  const titleBaseSize = 150;
  const titleMinSize = 50;
  const titleMaxTextHeight = titleAreaHeight - 24;
  const titleMaxStackWidth = titleColWidth - 24;

  const tokens = showName.split(/\s+/).filter(Boolean);
  let titleLines: string[] = [showName];
  let titleFontSize = titleBaseSize;

  const measureLongestLine = (lines: string[], size: number): number => {
    ctx.font = `700 ${size}px ${titleFontFamily}`;
    return Math.max(...lines.map((l) => ctx.measureText(l).width));
  };

  const fitsRotated = (lines: string[], size: number): boolean => {
    const longest = measureLongestLine(lines, size);
    const stackWidth = lines.length * size * 1.05;
    return longest <= titleMaxTextHeight && stackWidth <= titleMaxStackWidth;
  };

  const groupIntoLines = (count: number): string[] => {
    if (count <= 1 || tokens.length <= count) return [showName];
    const lines: string[] = [];
    const perLine = Math.ceil(tokens.length / count);
    for (let i = 0; i < tokens.length; i += perLine) {
      lines.push(tokens.slice(i, i + perLine).join(' '));
    }
    return lines;
  };

  const lineOptions: string[][] = [[showName]];
  if (tokens.length > 1) lineOptions.push(groupIntoLines(2));
  if (tokens.length > 3) lineOptions.push(groupIntoLines(3));

  let chosen: { lines: string[]; size: number } | null = null;
  for (const option of lineOptions) {
    let size = titleBaseSize;
    while (size >= titleMinSize) {
      if (fitsRotated(option, size)) {
        if (!chosen || size > chosen.size) chosen = { lines: option, size };
        break;
      }
      size -= 4;
    }
    if (chosen && chosen.size >= 100) break;
  }

  if (chosen) {
    titleLines = chosen.lines;
    titleFontSize = chosen.size;
  } else {
    titleLines = [showName];
    titleFontSize = titleMinSize;
  }

  ctx.save();
  ctx.translate(titleColCenterX, titleAreaBottom - 16);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${titleFontSize}px ${titleFontFamily}`;
  const lineSpacing = titleFontSize * 1.05;
  const totalWidth = (titleLines.length - 1) * lineSpacing;
  titleLines.forEach((line, i) => {
    const offset = -totalWidth / 2 + i * lineSpacing;
    ctx.fillText(line, 0, offset);
  });
  ctx.restore();

  const now = new Date();
  const monthNames = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const dateStr = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const liveStr = 'LIVE';

  const dateMaxTextHeight = titleAreaHeight - 24;
  const dateFontFamily = '"Fraunces", Georgia, serif';
  let dateFontSize = 40;
  ctx.font = `700 ${dateFontSize}px ${dateFontFamily}`;
  while (ctx.measureText(dateStr).width > dateMaxTextHeight && dateFontSize > 20) {
    dateFontSize -= 2;
    ctx.font = `700 ${dateFontSize}px ${dateFontFamily}`;
  }

  const liveFontFamily = '"Bebas Neue", Impact, sans-serif';
  const liveFontSize = 22;
  ctx.font = `700 ${liveFontSize}px ${liveFontFamily}`;
  const liveMeasuredWidth = ctx.measureText(liveStr).width;
  ctx.font = `700 ${dateFontSize}px ${dateFontFamily}`;
  const dateMeasuredWidth = ctx.measureText(dateStr).width;

  const dateGap = 40;
  const totalRotatedLen = liveMeasuredWidth + dateGap + dateMeasuredWidth;
  const startOffset = -totalRotatedLen / 2;

  ctx.save();
  ctx.translate(dateColCenterX, titleAreaCenterY);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `700 ${liveFontSize}px ${liveFontFamily}`;
  ctx.fillText(liveStr, startOffset + liveMeasuredWidth / 2, 0);

  ctx.font = `700 ${dateFontSize}px ${dateFontFamily}`;
  ctx.fillText(dateStr, startOffset + liveMeasuredWidth + dateGap + dateMeasuredWidth / 2, 0);

  ctx.restore();

  drawPerfDots(ctx, H - 14, W, colors.ink);

  punchCornerNotches(ctx, W, H, 22, { tl: true, tr: true });

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

function wrapCodeIntoLines(
  ctx: CanvasRenderingContext2D,
  code: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
): string[] {
  ctx.font = `700 ${fontSize}px ${fontFamily}`;
  if (ctx.measureText(code).width <= maxWidth) return [code];

  if (code.includes('-')) {
    const parts = code.split('-').filter((p) => p.length > 0);
    const lines: string[] = [];
    let cur = '';
    for (const part of parts) {
      const trial = cur ? `${cur}-${part}` : part;
      if (cur && ctx.measureText(trial).width > maxWidth) {
        lines.push(cur);
        cur = part;
      } else {
        cur = trial;
      }
    }
    if (cur) lines.push(cur);
    const anyOverflow = lines.some((l) => ctx.measureText(l).width > maxWidth);
    if (!anyOverflow) return lines;
  }

  const charW = ctx.measureText('M').width;
  const perLine = Math.max(1, Math.floor(maxWidth / charW));
  const chunks: string[] = [];
  for (let i = 0; i < code.length; i += perLine) chunks.push(code.slice(i, i + perLine));
  return chunks;
}

function createBottomHalfTexture(code: string, colors: TicketColors): THREE.CanvasTexture {
  const W = 700;
  const H = 440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, PAPER_DK);
  bg.addColorStop(1, colors.paper);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawPaperGrain(ctx, W, H);

  drawPerfDots(ctx, 14, W, colors.ink);

  const bandX = 82;
  drawAdmitOneBand(ctx, H, bandX, colors);

  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(bandX + 20, 28, W - bandX - 44, H - 48);

  const contentLeft = bandX + 48;
  const contentRight = W - 48;
  const contentWidth = contentRight - contentLeft;
  const contentCenter = (contentLeft + contentRight) / 2;

  const displayCode = (code || 'XXXX').toUpperCase();
  const codeMaxWidth = contentWidth - 20;
  const codeFontFamily = '"IBM Plex Mono", "Courier New", monospace';

  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '700 14px "Bebas Neue", Impact, sans-serif';
  ctx.fillText('SHOW CODE', contentCenter, 54);

  let codeSize = 44;
  const minCodeSize = 18;
  const maxLines = 4;
  let codeLines: string[] = [displayCode];
  while (codeSize >= minCodeSize) {
    codeLines = wrapCodeIntoLines(ctx, displayCode, codeMaxWidth, codeSize, codeFontFamily);
    if (codeLines.length <= maxLines) break;
    codeSize -= 4;
  }
  if (codeLines.length > maxLines) {
    codeLines = codeLines.slice(0, maxLines);
  }

  ctx.font = `700 ${codeSize}px ${codeFontFamily}`;
  ctx.fillStyle = colors.ink;
  const codeLineHeight = codeSize * 1.15;
  const codeBlockHeight = codeLines.length * codeLineHeight;
  const codeAreaTop = 82;
  const codeAreaBottom = H - 140;
  const codeTop = codeAreaTop + (codeAreaBottom - codeAreaTop - codeBlockHeight) / 2;
  codeLines.forEach((line, i) => {
    ctx.fillText(line, contentCenter, codeTop + i * codeLineHeight);
  });

  ctx.fillStyle = colors.ink;
  let bx = contentLeft + 20;
  const barY = H - 120;
  while (bx < contentRight - 20) {
    const w = 2 + Math.random() * 4;
    ctx.fillRect(bx, barY, w, 50);
    bx += w + 2 + Math.random() * 3;
  }

  ctx.textAlign = 'center';
  ctx.font = '700 13px "Bebas Neue", Impact, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText('KEEP THIS STUB', contentCenter, H - 50);

  punchCornerNotches(ctx, W, H, 22, { bl: true, br: true });

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

interface SoundKit {
  rip: Tone.NoiseSynth;
  thud: Tone.MembraneSynth;
  whoosh: Tone.NoiseSynth;
  chime: Tone.PolySynth;
}

function createSounds(): SoundKit {
  const ripHP = new Tone.Filter(1600, 'highpass').toDestination();
  const ripComp = new Tone.Compressor(-18, 4).connect(ripHP);
  const rip = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.002, decay: 0.22, sustain: 0, release: 0.06 },
  }).connect(ripComp);
  rip.volume.value = -6;

  const thud = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0 },
  }).toDestination();
  thud.volume.value = -10;

  const whooshLP = new Tone.Filter(900, 'lowpass').toDestination();
  const whoosh = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.09, decay: 0.28, sustain: 0, release: 0.05 },
  }).connect(whooshLP);
  whoosh.volume.value = -16;

  const chimeRev = new Tone.Reverb({ decay: 1.2, wet: 0.25 }).toDestination();
  const chime = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.6 },
  }).connect(chimeRev);
  chime.volume.value = -10;

  return { rip, thud, whoosh, chime };
}

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

type Phase = 'idle' | 'entering' | 'hovering' | 'shaking' | 'tearing' | 'falling' | 'success';

interface Particle {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  vrx: number;
  vry: number;
  vrz: number;
  life: number;
  maxLife: number;
}

interface ThreeRefs {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  topHalf: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  botHalf: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  ticketGroup: THREE.Group;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  glow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  particles: Particle[];
}

interface TicketRipProps {
  code: string;
  experienceName?: string;
  onComplete: () => void;
}

const SUCCESS_HOLD_DURATION = 7.1;

export default function TicketRip({ code, experienceName = '', onComplete }: TicketRipProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const threeRef = useRef<ThreeRefs | null>(null);
  const soundRef = useRef<{ kit: SoundKit | null; ready: boolean }>({ kit: null, ready: false });
  const animRef = useRef<{ phase: Phase; time: number }>({ phase: 'idle', time: 0 });
  const onCompleteFiredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const [fontsReady, setFontsReady] = useState(false);
  const [caption, setCaption] = useState<'hidden' | 'tap-rip' | 'validating' | 'tap-continue'>(
    'hidden',
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    ensureFontsLoaded().then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fireComplete = useCallback(() => {
    if (onCompleteFiredRef.current) return;
    onCompleteFiredRef.current = true;
    onCompleteRef.current();
  }, []);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const phase = animRef.current.phase;
      if (phase === 'hovering') {
        animRef.current.phase = 'shaking';
        animRef.current.time = 0;
        setCaption('validating');
        return;
      }
      if (phase === 'success') {
        fireComplete();
      }
    },
    [fireComplete],
  );

  useEffect(() => {
    if (!fontsReady) return;
    const mount = mountRef.current;
    if (!mount) return;

    const colors = resolveTicketColors();

    const initAudio = async () => {
      try {
        await Tone.start();
        soundRef.current = { kit: createSounds(), ready: true };
      } catch {
        soundRef.current = { kit: null, ready: false };
      }
    };
    initAudio();

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    const isPortrait = h >= w;
    const baseCameraZ = isPortrait ? 11.5 : 13;
    camera.position.set(0, 0.1, baseCameraZ);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const key = new THREE.DirectionalLight(colors.paper, 0.7);
    key.position.set(4, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(colors.phosphor, 0.32);
    rim.position.set(-5, 2, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xf5a623, 0.15);
    fill.position.set(0, -3, 4);
    scene.add(fill);

    const TW = 2.4;
    const TOP_H = 3.84;
    const BOT_H = 1.5;

    const topTex = createTopHalfTexture(experienceName, colors);
    const botTex = createBottomHalfTexture(code, colors);

    const topGeom = new THREE.PlaneGeometry(TW, TOP_H, 10, 20);
    const topMat = new THREE.MeshStandardMaterial({
      map: topTex,
      side: THREE.DoubleSide,
      roughness: 0.82,
      metalness: 0.02,
      transparent: true,
      alphaTest: 0.01,
    });
    const topHalf = new THREE.Mesh(topGeom, topMat);
    topHalf.position.y = TOP_H / 2;

    const botGeom = new THREE.PlaneGeometry(TW, BOT_H, 10, 8);
    const botMat = new THREE.MeshStandardMaterial({
      map: botTex,
      side: THREE.DoubleSide,
      roughness: 0.82,
      metalness: 0.02,
      transparent: true,
      alphaTest: 0.01,
    });
    const botHalf = new THREE.Mesh(botGeom, botMat);
    botHalf.position.y = -BOT_H / 2;

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const grad = shadowCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
      grad.addColorStop(0, 'rgba(0,0,0,0.55)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      shadowCtx.fillStyle = grad;
      shadowCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(TW * 1.6, TW * 1.6),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    shadow.position.set(0, -(TOP_H + BOT_H) / 2 - 0.3, -0.1);

    const ticketGroup = new THREE.Group();
    ticketGroup.add(topHalf);
    ticketGroup.add(botHalf);
    const DOWN_SHIFT = 0.7;
    const vOffset = -(TOP_H - BOT_H) / 4 - DOWN_SHIFT;
    ticketGroup.position.y = vOffset;
    ticketGroup.visible = false;
    scene.add(shadow);
    shadow.visible = false;
    scene.add(ticketGroup);

    const MAX_P = 90;
    const pGeom = new THREE.PlaneGeometry(0.09, 0.09);
    const particles: Particle[] = [];
    for (let i = 0; i < MAX_P; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? colors.phosphor : colors.paper,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(pGeom, mat);
      mesh.visible = false;
      scene.add(mesh);
      particles.push({
        mesh,
        active: false,
        vx: 0,
        vy: 0,
        vz: 0,
        vrx: 0,
        vry: 0,
        vrz: 0,
        life: 0,
        maxLife: 1,
      });
    }

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const glowCtx = glowCanvas.getContext('2d');
    if (glowCtx) {
      const grad = glowCtx.createRadialGradient(128, 128, 20, 128, 128, 128);
      grad.addColorStop(0, 'rgba(200, 240, 96, 0.85)');
      grad.addColorStop(0.5, 'rgba(200, 240, 96, 0.35)');
      grad.addColorStop(1, 'rgba(200, 240, 96, 0)');
      glowCtx.fillStyle = grad;
      glowCtx.fillRect(0, 0, 256, 256);
    }
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 7),
      new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.position.set(0, vOffset, -0.9);
    glow.renderOrder = -10;
    scene.add(glow);

    threeRef.current = {
      scene,
      camera,
      renderer,
      topHalf,
      botHalf,
      ticketGroup,
      shadow,
      glow,
      particles,
    };

    animRef.current = { phase: 'entering', time: 0 };

    if (soundRef.current.ready && soundRef.current.kit) {
      soundRef.current.kit.whoosh.triggerAttackRelease(0.3);
    } else {
      setTimeout(() => {
        if (soundRef.current.ready && soundRef.current.kit) {
          soundRef.current.kit.whoosh.triggerAttackRelease(0.3);
        }
      }, 100);
    }

    const clock = new THREE.Clock();
    let frameId = 0;

    const spawnParticles = () => {
      const groupWorldY = ticketGroup.position.y;
      particles.forEach((p) => {
        p.active = true;
        p.mesh.visible = true;
        const spread = TW * 0.9;
        p.mesh.position.x = (Math.random() - 0.5) * spread;
        p.mesh.position.y = groupWorldY + (Math.random() - 0.5) * 0.1;
        p.mesh.position.z = 0.05 + Math.random() * 0.25;
        p.vx = (Math.random() - 0.5) * 2.0;
        p.vy = 0.6 + Math.random() * 2.2;
        p.vz = (Math.random() - 0.5) * 1.6;
        p.vrx = (Math.random() - 0.5) * 14;
        p.vry = (Math.random() - 0.5) * 14;
        p.vrz = (Math.random() - 0.5) * 14;
        p.life = 0;
        p.maxLife = 0.7 + Math.random() * 0.8;
        p.mesh.material.opacity = 1;
        p.mesh.scale.setScalar(0.6 + Math.random() * 0.8);
      });
    };

    const updateParticles = (dt: number) => {
      particles.forEach((p) => {
        if (!p.active) return;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
          return;
        }
        p.vy -= 9 * dt;
        p.vx *= 0.985;
        p.vz *= 0.985;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += p.vrx * dt;
        p.mesh.rotation.y += p.vry * dt;
        p.mesh.rotation.z += p.vrz * dt;
        const f = p.life / p.maxLife;
        p.mesh.material.opacity = 1 - f * f;
      });
    };

    const runFrame = (dt: number) => {
      const baseTopY = TOP_H / 2;
      const baseBotY = -BOT_H / 2;

      updateParticles(dt);

      const ph = animRef.current.phase;
      const tt = animRef.current.time;

      if (ph === 'idle') {
        ticketGroup.visible = false;
        shadow.visible = false;
        glow.material.opacity = 0;
        return;
      }

      ticketGroup.visible = true;
      shadow.visible = true;
      botHalf.material.opacity = 1;

      if (ph === 'entering') {
        const dur = 0.7;
        const t = clamp01(tt / dur);
        const e = easeOutBack(t);
        ticketGroup.position.x = 0;
        ticketGroup.position.y = vOffset + (1 - e) * -7;
        ticketGroup.rotation.x = (1 - e) * 0.55;
        ticketGroup.rotation.z = (1 - e) * -0.35;
        ticketGroup.rotation.y = (1 - e) * 0.2;
        ticketGroup.scale.setScalar(0.55 + 0.45 * e);
        topHalf.position.set(0, baseTopY, 0);
        botHalf.position.set(0, baseBotY, 0);
        topHalf.rotation.set(0, 0, 0);
        botHalf.rotation.set(0, 0, 0);
        shadow.material.opacity = e * 0.45;
        shadow.scale.setScalar(0.7 + 0.3 * e);
        if (t >= 1) {
          animRef.current.phase = 'hovering';
          animRef.current.time = 0;
          setCaption('tap-rip');
        }
      } else if (ph === 'hovering') {
        ticketGroup.position.x = 0;
        ticketGroup.position.y = vOffset + Math.sin(tt * 3.2) * 0.05;
        ticketGroup.rotation.x = Math.sin(tt * 2) * 0.04 - 0.03;
        ticketGroup.rotation.y = Math.sin(tt * 1.6 + 0.8) * 0.08;
        ticketGroup.rotation.z = Math.sin(tt * 2.2) * 0.02;
        ticketGroup.scale.setScalar(1);
        shadow.material.opacity = 0.45 + Math.sin(tt * 3.2) * 0.05;
      } else if (ph === 'shaking') {
        const dur = 0.32;
        const t = clamp01(tt / dur);
        const intensity = easeInCubic(t) * 0.07;
        ticketGroup.position.x = (Math.random() - 0.5) * intensity;
        ticketGroup.position.y = vOffset + (Math.random() - 0.5) * intensity;
        ticketGroup.rotation.z = (Math.random() - 0.5) * intensity * 2.5;
        ticketGroup.rotation.y = Math.sin(tt * 1.6) * 0.06;
        ticketGroup.rotation.x = -0.03;
        ticketGroup.scale.setScalar(1 + easeInCubic(t) * 0.03);
        shadow.material.opacity = 0.45;
        if (t >= 1) {
          animRef.current.phase = 'tearing';
          animRef.current.time = 0;
          if (soundRef.current.ready && soundRef.current.kit) {
            soundRef.current.kit.rip.triggerAttackRelease(0.22);
            soundRef.current.kit.thud.triggerAttackRelease('C2', 0.3);
          }
          spawnParticles();
        }
      } else if (ph === 'tearing') {
        const dur = 0.24;
        const t = clamp01(tt / dur);
        const e = easeOutQuart(t);
        topHalf.position.y = baseTopY + e * 0.18;
        topHalf.rotation.z = Math.sin(tt * 40) * 0.02 * (1 - e);
        topHalf.rotation.x = -e * 0.05;
        botHalf.position.y = baseBotY - e * 0.22;
        botHalf.rotation.z = -e * 0.09;
        botHalf.rotation.x = e * 0.08;
        ticketGroup.position.x = (1 - e) * 0.09 * Math.sin(tt * 70);
        ticketGroup.position.y = vOffset + (1 - e) * 0.06 * Math.sin(tt * 55);
        ticketGroup.rotation.y = Math.sin(tt * 1.6) * 0.06;
        ticketGroup.rotation.x = -0.03;
        ticketGroup.scale.setScalar(1 + (1 - e) * 0.025);
        shadow.material.opacity = 0.5;
        camera.position.z = baseCameraZ - e * 0.25;
        if (t >= 1) {
          animRef.current.phase = 'falling';
          animRef.current.time = 0;
        }
      } else if (ph === 'falling') {
        const dur = 1.2;
        const t = clamp01(tt / dur);
        const settle = easeOutCubic(clamp01(t * 2.5));
        topHalf.position.y = baseTopY + 0.18 - settle * 0.18;
        topHalf.rotation.z = 0;
        topHalf.rotation.x = -0.05 + settle * 0.05;
        const pulse = 0.5 + 0.5 * Math.sin(tt * 6);
        glow.material.opacity = easeOutCubic(t) * 0.55 * (0.65 + pulse * 0.35);
        glow.scale.setScalar(0.85 + easeOutCubic(t) * 0.2);
        glow.position.y = ticketGroup.position.y + topHalf.position.y;
        const g = 11;
        const fy = -0.22 - 0.5 * g * tt * tt;
        const fx = Math.sin(tt * 2.2) * 0.35 + tt * 0.1;
        botHalf.position.y = baseBotY + fy;
        botHalf.position.x = fx;
        botHalf.position.z = Math.sin(tt * 3) * 0.25;
        botHalf.rotation.z = -0.09 - tt * 2.4;
        botHalf.rotation.x = tt * 1.9;
        botHalf.rotation.y = tt * 1.2;
        botHalf.material.opacity = clamp01(1 - Math.max(0, t - 0.55) * 2.5);
        ticketGroup.position.x = 0;
        ticketGroup.position.y = vOffset + Math.sin(tt * 2) * 0.025;
        ticketGroup.rotation.x = -0.03;
        ticketGroup.rotation.y = Math.sin(tt * 1.5) * 0.06;
        ticketGroup.rotation.z = 0;
        ticketGroup.scale.setScalar(1);
        shadow.material.opacity = 0.45;
        camera.position.z = baseCameraZ - 0.25;
        if (t >= 1) {
          animRef.current.phase = 'success';
          animRef.current.time = 0;
          botHalf.visible = false;
          setCaption('tap-continue');
          if (soundRef.current.ready && soundRef.current.kit) {
            const now = Tone.now();
            soundRef.current.kit.chime.triggerAttackRelease('E5', '8n', now);
            soundRef.current.kit.chime.triggerAttackRelease('G5', '8n', now + 0.09);
            soundRef.current.kit.chime.triggerAttackRelease('C6', '4n', now + 0.19);
          }
        }
      } else if (ph === 'success') {
        ticketGroup.position.y = vOffset + 0.35 + Math.sin(tt * 2) * 0.05;
        ticketGroup.rotation.y = Math.sin(tt * 1.2) * 0.1;
        ticketGroup.rotation.x = -0.03 + Math.sin(tt * 1.8) * 0.02;
        ticketGroup.rotation.z = Math.sin(tt * 0.8) * 0.02;
        const pulse = 0.5 + 0.5 * Math.sin(tt * 3);
        glow.material.opacity = 0.35 + pulse * 0.15;
        glow.position.y = ticketGroup.position.y + topHalf.position.y;
        shadow.material.opacity = 0.35;
        camera.position.z = baseCameraZ - 0.25;
        if (!onCompleteFiredRef.current && tt >= SUCCESS_HOLD_DURATION) {
          fireComplete();
        }
      }
    };

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 1 / 30);
      animRef.current.time += dt;
      runFrame(dt);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      topGeom.dispose();
      botGeom.dispose();
      topMat.dispose();
      botMat.dispose();
      pGeom.dispose();
      shadowTex.dispose();
      glowTex.dispose();
      topTex.dispose();
      botTex.dispose();
      shadow.geometry.dispose();
      shadow.material.dispose();
      glow.geometry.dispose();
      glow.material.dispose();
      particles.forEach((p) => p.mesh.material.dispose());
      if (soundRef.current.kit) {
        const kit = soundRef.current.kit;
        kit.rip.dispose();
        kit.thud.dispose();
        kit.whoosh.dispose();
        kit.chime.dispose();
        soundRef.current = { kit: null, ready: false };
      }
    };
  }, [fontsReady, code, experienceName, fireComplete]);

  const captionText =
    caption === 'tap-rip'
      ? 'TAP TO TEAR'
      : caption === 'validating'
        ? 'VALIDATING TICKET…'
        : caption === 'tap-continue'
          ? 'TAP TO CONTINUE'
          : '';
  const captionActive = caption === 'tap-rip' || caption === 'tap-continue';

  return (
    <div
      className={styles.root}
      onPointerDown={handlePointerDown}
      role="button"
      tabIndex={0}
      aria-label={caption === 'tap-rip' ? 'Tap to tear ticket' : 'Tap to continue'}
    >
      <div className={styles.grain} />
      <div className={styles.vignette} />
      <div ref={mountRef} className={styles.canvas} />
      {caption !== 'hidden' && (
        <div className={`${styles.caption} ${captionActive ? styles.captionReady : ''}`}>
          {captionText}
        </div>
      )}
    </div>
  );
}
