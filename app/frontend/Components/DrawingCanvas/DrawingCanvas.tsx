import { useCallback, useEffect, useRef, useState } from 'react';

import { Layer, Line, Stage } from 'react-konva';

import { Button } from '@cctv/core/Button/Button';
import { AvatarStroke } from '@cctv/types';

import styles from './DrawingCanvas.module.scss';

export interface DrawingCanvasProps {
  initialStrokes?: AvatarStroke[];
  palette?: string[];
  brushSizes?: number[];
  drawSize?: { w: number; h: number };
  onStrokeEvent?: (e: {
    operation: 'stroke_started' | 'stroke_points_appended' | 'stroke_ended' | 'canvas_cleared';
    data?: Record<string, unknown>;
  }) => void;
  onSubmit: (strokes: AvatarStroke[]) => void | Promise<void>;
  onBack?: () => void;
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

export default function DrawingCanvas({
  initialStrokes = [],
  palette,
  brushSizes = [2, 4, 8, 32],
  drawSize = { w: 320, h: 320 },
  onStrokeEvent,
  onSubmit,
  onBack,
}: DrawingCanvasProps) {
  const [lines, setLines] = useState<AvatarStroke[]>(initialStrokes);
  const [isDrawing, setIsDrawing] = useState(false);

  const [penWidth, setPenWidth] = useState<number>(4);
  const [penColor, setPenColor] = useState<string>('#000000');
  const [colors, setColors] = useState<string[]>([]);

  const drawWrapRef = useRef<HTMLDivElement | null>(null);
  const [drawStageSize, setDrawStageSize] = useState<{ w: number; h: number }>({
    w: drawSize.w,
    h: drawSize.h,
  });

  // Batch points for throttled websocket updates
  const pendingPointsRef = useRef<number[]>([]);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const pal =
      palette && palette.length > 0 ? palette : DEFAULT_PALETTE_VARS.map((v) => resolveCssVar(v));
    setColors(pal);
    if (!penColor || penColor === '#000000') setPenColor(pal[0] || '#000000');
  }, [palette]);

  // Converts a raw canvas pixel position to the fixed drawSize coordinate space.
  const toDrawSpace = (x: number, y: number) => ({
    x: Math.round(x * (drawSize.w / drawStageSize.w) * 10) / 10,
    y: Math.round(y * (drawSize.h / drawStageSize.h) * 10) / 10,
  });

  const onPointerDown = (e: any) => {
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    setIsDrawing(true);
    isDrawingRef.current = true;
    const p = e.target.getStage().getPointerPosition();
    if (!p) return;
    const dp = toDrawSpace(p.x, p.y);
    const stroke: AvatarStroke = { points: [dp.x, dp.y], color: penColor, width: penWidth };
    setLines((prev) => [...prev, stroke]);
    onStrokeEvent?.({
      operation: 'stroke_started',
      data: { points: stroke.points, color: stroke.color, width: stroke.width },
    });
  };

  // Flush pending points
  const flushPendingPoints = useCallback(() => {
    if (pendingPointsRef.current.length > 0) {
      onStrokeEvent?.({
        operation: 'stroke_points_appended',
        data: { points: pendingPointsRef.current },
      });
      pendingPointsRef.current = [];
    }
  }, [onStrokeEvent]);

  const onPointerMove = (e: any) => {
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;
    const dp = toDrawSpace(point.x, point.y);

    // Calculate the new points immediately
    const added = [dp.x, dp.y];

    // Update local UI state
    setLines((prev) => {
      const next = prev.slice();
      const last = next[next.length - 1];
      if (!last) return next;
      last.points = last.points.concat(added);
      next[next.length - 1] = { ...last };
      return next;
    });

    // Batch points for throttled websocket updates
    pendingPointsRef.current.push(...added);

    // Throttle: send batched points every 100ms
    if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        flushPendingPoints();
        throttleTimerRef.current = null;
      }, 1000);
    }
  };

  const onPointerUp = (e?: any) => {
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    setIsDrawing(false);
    isDrawingRef.current = false;

    // Flush any remaining points before ending stroke
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    flushPendingPoints();

    onStrokeEvent?.({ operation: 'stroke_ended' });
  };

  // Cleanup throttle timer on unmount
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  // End stroke if mouse is released outside the canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!isDrawingRef.current) return;
      setIsDrawing(false);
      isDrawingRef.current = false;
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      flushPendingPoints();
      onStrokeEvent?.({ operation: 'stroke_ended' });
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [flushPendingPoints, onStrokeEvent]);

  const handleSubmit = async () => {
    await onSubmit(lines);
  };

  useEffect(() => {
    const updateSize = () => {
      if (drawWrapRef.current) {
        const rect = drawWrapRef.current.getBoundingClientRect();
        const w = Math.floor(rect.width);
        setDrawStageSize({ w, h: w });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const drawScale = {
    x: drawStageSize.w / drawSize.w,
    y: drawStageSize.h / drawSize.h,
  };

  return (
    <div className={styles.root}>
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
          <label
            className={`${styles.swatch} ${styles.colorPickerLabel} ${!colors.includes(penColor) ? styles.swatchActive : ''}`}
            style={!colors.includes(penColor) ? { background: penColor } : undefined}
            title="Custom color"
          >
            <input
              type="color"
              className={styles.hiddenColorInput}
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div ref={drawWrapRef} className={`${styles.stageWrap} ${styles.square}`}>
        <Stage
          width={drawStageSize.w}
          height={drawStageSize.h}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        >
          <Layer scaleX={drawScale.x} scaleY={drawScale.y}>
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

      <div className={styles.controls}>
        <Button
          className={styles.btn}
          onClick={() => {
            setLines([]);
            onStrokeEvent?.({ operation: 'canvas_cleared' });
          }}
        >
          Clear
        </Button>
        {onBack ? (
          <Button
            className={styles.btn}
            onClick={async () => {
              await onSubmit(lines);
              onBack();
            }}
          >
            Back
          </Button>
        ) : (
          <Button className={styles.btn} onClick={handleSubmit} disabled={lines.length === 0}>
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}
