import { useEffect, useMemo, useRef, useState } from 'react';

import { Image as KonvaImage, Layer, Line, Stage } from 'react-konva';

import { Button } from '@cctv/core';

import styles from './DrawingCanvas.module.scss';

type Mode = 'draw' | 'position';

type Stroke = { points: number[]; color: string; width: number };

export interface DrawingCanvasProps {
  initialImage?: string;
  initialPosition?: { x: number; y: number };
  defaultMode?: Mode;
  palette?: string[];
  brushSizes?: number[]; // e.g., [2,4,8,32]
  drawSize?: { w: number; h: number };
  positionSize?: { w: number; h: number };
  onStrokeEvent?: (e: {
    operation: 'stroke_started' | 'stroke_points_appended' | 'stroke_ended';
    data?: any;
  }) => void;
  onPositionDrag?: (pos: { x: number; y: number }) => void;
  onSaveDrawing?: (dataUrl: string) => void | Promise<void>;
  onSavePosition?: (pos: { x: number; y: number }) => void | Promise<void>;
  onFinalize?: () => void;
}

const DEFAULT_PALETTE_VARS = [
  '--blue',
  '--pink',
  '--teal',
  '--yellow',
  '--red',
  '--green',
  '--white',
] as const;

function resolveCssVar(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || '#000000';
}

function useHtmlImage(src?: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = src;
    return () => setImg(null);
  }, [src]);
  return img;
}

export default function DrawingCanvas({
  initialImage,
  initialPosition,
  defaultMode = 'draw',
  palette,
  brushSizes = [2, 4, 8, 32],
  drawSize = { w: 320, h: 320 },
  positionSize = { w: 640, h: 360 },
  onStrokeEvent,
  onPositionDrag,
  onSaveDrawing,
  onSavePosition,
  onFinalize,
}: DrawingCanvasProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [lines, setLines] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [penWidth, setPenWidth] = useState<number>(4);
  const [penColor, setPenColor] = useState<string>('#000000');
  const [colors, setColors] = useState<string[]>([]);

  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(initialImage);
  const [position, setPosition] = useState<{ x: number; y: number } | undefined>(initialPosition);

  const drawRef = useRef<any>(null);
  const drawWrapRef = useRef<HTMLDivElement | null>(null);
  const posWrapRef = useRef<HTMLDivElement | null>(null);
  const [drawStageSize, setDrawStageSize] = useState<{ w: number; h: number }>({
    w: drawSize.w,
    h: drawSize.h,
  });
  const [posStageSize, setPosStageSize] = useState<{ w: number; h: number }>({
    w: positionSize.w,
    h: positionSize.h,
  });

  const img = useHtmlImage(avatarDataUrl);

  useEffect(() => {
    const pal =
      palette && palette.length > 0 ? palette : DEFAULT_PALETTE_VARS.map((v) => resolveCssVar(v));
    setColors(pal);
    if (!penColor || penColor === '#000000') setPenColor(pal[0] || '#000000');
  }, [palette]);

  const onPointerDown = (e: any) => {
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    if (mode !== 'draw') return;
    setIsDrawing(true);
    const p = e.target.getStage().getPointerPosition();
    if (!p) return;
    const stroke = { points: [p.x, p.y], color: penColor, width: penWidth };
    setLines((prev) => [...prev, stroke]);
    onStrokeEvent?.({ operation: 'stroke_started', data: stroke });
  };

  const onPointerMove = (e: any) => {
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    if (mode !== 'draw' || !isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;
    const ptsAdded: number[] = [];
    setLines((prev) => {
      const next = prev.slice();
      const last = next[next.length - 1];
      if (!last) return next;
      const added = [point.x, point.y];
      last.points = last.points.concat(added);
      ptsAdded.push(...added);
      next[next.length - 1] = { ...last };
      return next;
    });
    if (ptsAdded.length > 0)
      onStrokeEvent?.({ operation: 'stroke_points_appended', data: { points: ptsAdded } });
  };

  const onPointerUp = (e?: any) => {
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    if (mode !== 'draw') return;
    setIsDrawing(false);
    onStrokeEvent?.({ operation: 'stroke_ended' });
  };

  const saveDrawing = async () => {
    const uri = drawRef.current?.toDataURL({ pixelRatio: 2 });
    setAvatarDataUrl(uri);
    setMode('position');
    await onSaveDrawing?.(uri);
  };

  const savePosition = async () => {
    if (!position) return;
    await onSavePosition?.(position);
  };

  const finalizeFromDraw = async () => {
    // Ensure we persist current drawing before closing
    await saveDrawing();
    onFinalize?.();
  };

  const finalizeFromPosition = async () => {
    if (position) await onSavePosition?.(position);
    onFinalize?.();
  };

  useEffect(() => {
    const updateSizes = () => {
      if (drawWrapRef.current) {
        const rect = drawWrapRef.current.getBoundingClientRect();
        const w = Math.floor(rect.width);
        setDrawStageSize({ w, h: w });
      }
      if (posWrapRef.current) {
        const rect = posWrapRef.current.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        setPosStageSize({ w, h });
      }
    };
    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <Button
          className={`${styles.btn} ${styles.modeBtn} ${mode === 'draw' ? styles.modeActive : ''}`}
          aria-pressed={mode === 'draw'}
          onClick={() => setMode('draw')}
        >
          Drawing
        </Button>
        <Button
          className={`${styles.btn} ${styles.modeBtn} ${mode === 'position' ? styles.modeActive : ''}`}
          aria-pressed={mode === 'position'}
          onClick={() => setMode('position')}
        >
          Positioning
        </Button>
      </div>

      {mode === 'draw' && (
        <div className={styles.toolbar}>
          <div className={styles.sizeGroup}>
            {brushSizes.map((sz) => (
              <button
                key={sz}
                className={`${styles.sizeBtn} ${penWidth === sz ? styles.sizeActive : ''}`}
                onClick={() => setPenWidth(sz)}
              >
                {sz === 2 ? 'Thin' : sz === 4 ? 'Medium' : sz === 8 ? 'Thick' : 'Huge'}
              </button>
            ))}
          </div>
          <div className={styles.palette}>
            {colors.map((c) => (
              <button
                key={c}
                aria-label={`Color ${c}`}
                className={`${styles.swatch} ${penColor === c ? styles.swatchActive : ''}`}
                style={{ background: c }}
                onClick={() => setPenColor(c)}
              />
            ))}
          </div>
        </div>
      )}

      {mode === 'draw' && (
        <div ref={drawWrapRef} className={`${styles.stageWrap} ${styles.square}`}>
          <Stage
            ref={drawRef}
            width={drawStageSize.w}
            height={drawStageSize.h}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          >
            <Layer>
              {lines.map((s, i) => (
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
      )}

      {mode === 'draw' && (
        <div className={styles.controls}>
          <Button className={styles.btn} onClick={() => setLines([])}>
            Clear
          </Button>
          <Button className={styles.btn} onClick={saveDrawing} disabled={lines.length === 0}>
            Save Drawing
          </Button>
          <Button className={styles.btn} onClick={finalizeFromDraw} disabled={lines.length === 0}>
            Submit
          </Button>
        </div>
      )}

      {mode === 'position' && (
        <div ref={posWrapRef} className={`${styles.stageWrap} ${styles.wide}`}>
          <Stage width={posStageSize.w} height={posStageSize.h}>
            <Layer>
              {img && (
                <KonvaImage
                  draggable
                  image={img}
                  width={128}
                  height={128}
                  x={position?.x ?? positionSize.w / 2 - 64}
                  y={position?.y ?? positionSize.h / 2 - 64}
                  onDragEnd={(e) => {
                    const pos = { x: e.target.x(), y: e.target.y() };
                    setPosition(pos);
                    onPositionDrag?.(pos);
                  }}
                />
              )}
            </Layer>
          </Stage>
        </div>
      )}

      {mode === 'position' && (
        <div className={styles.controls}>
          <Button className={styles.btn} onClick={() => setMode('draw')}>
            Redraw
          </Button>
          <Button className={styles.btn} onClick={savePosition} disabled={!position}>
            Save Position
          </Button>
          <Button className={styles.btn} onClick={finalizeFromPosition} disabled={!position}>
            Submit
          </Button>
        </div>
      )}

      <p className={styles.hint}>
        {mode === 'draw' ? 'Draw your avatar.' : 'Drag to position your avatar.'}
      </p>
    </div>
  );
}
