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
    operation:
      | 'stroke_started'
      | 'stroke_points_appended'
      | 'stroke_ended'
      | 'canvas_cleared'
      | 'stroke_undone'
      | 'canvas_clear_undone';
    data?: Record<string, unknown>;
  }) => void;
  onSubmit: (strokes: AvatarStroke[]) => void | Promise<void>;
  onBack?: () => void;
}

const DEFAULT_PALETTE_VARS = [
  '--phosphor',
  '--amber',
  '--red',
  '--hot-white',
  '--dim',
  '--deep',
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
  const [clearedLines, setClearedLines] = useState<AvatarStroke[] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const hasLoadedInitialRef = useRef(false);

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

  useEffect(() => {
    if (!hasLoadedInitialRef.current && initialStrokes.length > 0) {
      hasLoadedInitialRef.current = true;
      setLines(initialStrokes);
    }
  }, [initialStrokes]);

  // Converts a raw canvas pixel position to the fixed drawSize coordinate space.
  const toDrawSpace = (x: number, y: number) => ({
    x: Math.round(x * (drawSize.w / drawStageSize.w) * 10) / 10,
    y: Math.round(y * (drawSize.h / drawStageSize.h) * 10) / 10,
  });

  const onPointerDown = (e: any) => {
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    setClearedLines(null);
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

    // If the stroke has only one point (tap without drag), duplicate it so Konva renders a dot
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.points.length !== 2) return prev;
      const next = prev.slice();
      next[next.length - 1] = { ...last, points: [...last.points, last.points[0], last.points[1]] };
      return next;
    });

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

      setLines((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.points.length !== 2) return prev;
        const next = prev.slice();
        next[next.length - 1] = {
          ...last,
          points: [...last.points, last.points[0], last.points[1]],
        };
        return next;
      });

      onStrokeEvent?.({ operation: 'stroke_ended' });
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [flushPendingPoints, onStrokeEvent]);

  const onUndo = () => {
    if (lines.length === 0 && clearedLines) {
      setLines(clearedLines);
      setClearedLines(null);
      onStrokeEvent?.({
        operation: 'canvas_clear_undone',
        data: { strokes: clearedLines },
      });
      return;
    }
    const last = lines[lines.length - 1];
    if (!last || last.committed) return;
    setLines((prev) => prev.slice(0, -1));
    onStrokeEvent?.({ operation: 'stroke_undone' });
  };

  const canUndo = lines.some((s) => !s.committed) || (lines.length === 0 && !!clearedLines);

  const handleSubmit = async () => {
    const committedLines = lines.map((s) => ({ ...s, committed: true }));
    await onSubmit(committedLines);
    setLines(committedLines);
  };

  useEffect(() => {
    const updateSize = () => {
      if (drawWrapRef.current) {
        const side = Math.floor(drawWrapRef.current.getBoundingClientRect().width);
        setDrawStageSize({ w: side, h: side });
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
        <Button variant="secondary" className={styles.btn} onClick={onUndo} disabled={!canUndo}>
          Undo
        </Button>
        <Button
          variant="secondary"
          className={styles.btn}
          onClick={() => {
            if (lines.length > 0) setClearedLines(lines);
            setLines([]);
            onStrokeEvent?.({ operation: 'canvas_cleared' });
          }}
        >
          Clear
        </Button>
        {onBack ? (
          <Button
            variant="secondary"
            className={styles.btn}
            onClick={async () => {
              const committedLines = lines.map((s) => ({ ...s, committed: true }));
              await onSubmit(committedLines);
              setLines(committedLines);
              onBack();
            }}
          >
            Save
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
