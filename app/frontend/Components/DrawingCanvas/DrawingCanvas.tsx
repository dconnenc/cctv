import { useCallback, useEffect, useRef, useState } from 'react';

import { Image as KonvaImage, Layer, Line, Rect, Stage } from 'react-konva';

import { applyCosmetic, getCosmeticDragData } from '@cctv/components/Cosmetics';
import { Button } from '@cctv/core/Button/Button';
import { AvatarStroke, CosmeticPlacement } from '@cctv/types';

import CosmeticNode from './CosmeticNode';
import { flattenStrokesToDataUrl } from './flatten';

import styles from './DrawingCanvas.module.scss';

/** A stroke as it is serialised onto the drawing websocket channel. */
type SerializedStroke = { [K in keyof AvatarStroke]: AvatarStroke[K] };

/** Live drawing operations relayed to the monitor while a participant draws. */
export type DrawingCanvasEvent =
  | { operation: 'stroke_started'; data: { points: number[]; color: string; width: number } }
  | { operation: 'stroke_points_appended'; data: { points: number[] } }
  | { operation: 'canvas_clear_undone'; data: { strokes: SerializedStroke[] } }
  | { operation: 'stroke_ended' | 'canvas_cleared' | 'stroke_undone' };

/** A stroke while it is owned by the canvas: carries a render key the API never sees. */
interface CanvasStroke extends AvatarStroke {
  id: string;
}

export interface DrawingCanvasSubmission {
  image: string;
  cosmetics: CosmeticPlacement[];
}

export type DrawingCanvasMode = 'draw' | 'decorate' | 'background';

export interface DrawingCanvasProps {
  initialStrokes?: AvatarStroke[];
  // A previously flattened avatar image, shown as the base layer when re-editing.
  initialImage?: string | null;
  cosmetics?: CosmeticPlacement[];
  onCosmeticsChange?: (next: CosmeticPlacement[]) => void;
  // 'draw' lets the user draw and locks cosmetics; 'decorate' locks drawing and
  // lets the user move/remove clothing.
  mode?: DrawingCanvasMode;
  palette?: string[];
  brushSizes?: number[];
  drawSize?: { w: number; h: number };
  onStrokeEvent?: (event: DrawingCanvasEvent) => void;
  onSubmit: (submission: DrawingCanvasSubmission) => void | Promise<void>;
  onBack?: () => void;
  // Incrementing this from a parent force-submits the current drawing without a
  // button press — used to auto-dispatch when a timer expires.
  submitSignal?: number;
}

const DEFAULT_PALETTE_VARS = [
  '--phosphor',
  '--amber',
  '--red',
  '--hot-white',
  '--dim',
  '--deep',
] as const;

const NO_INITIAL_STROKES: AvatarStroke[] = [];
const NO_COSMETICS: CosmeticPlacement[] = [];
const DEFAULT_BRUSH_SIZES = [2, 4, 8, 32];
const DEFAULT_DRAW_SIZE = { w: 320, h: 320 };

let strokeIdCounter = 0;

function nextStrokeId() {
  strokeIdCounter += 1;
  return `stroke-${strokeIdCounter}`;
}

function withRenderIds(strokes: AvatarStroke[]): CanvasStroke[] {
  return strokes.map((stroke) => ({ ...stroke, id: nextStrokeId() }));
}

function withoutRenderIds(strokes: CanvasStroke[]): AvatarStroke[] {
  return strokes.map(({ id: _id, ...stroke }) => stroke);
}

function resolveCssVar(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || '#000000';
}

function handleDragOver(e: React.DragEvent) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

export default function DrawingCanvas({
  initialStrokes = NO_INITIAL_STROKES,
  initialImage = null,
  cosmetics = NO_COSMETICS,
  onCosmeticsChange,
  mode = 'draw',
  palette,
  brushSizes = DEFAULT_BRUSH_SIZES,
  drawSize = DEFAULT_DRAW_SIZE,
  onStrokeEvent,
  onSubmit,
  onBack,
  submitSignal,
}: DrawingCanvasProps) {
  const [lines, setLines] = useState<CanvasStroke[]>(() => withRenderIds(initialStrokes));
  const [clearedLines, setClearedLines] = useState<CanvasStroke[] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedCosmetic, setSelectedCosmetic] = useState<number | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [openTool, setOpenTool] = useState<'brush' | 'color' | null>(null);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [clearedBaseImage, setClearedBaseImage] = useState<HTMLImageElement | null>(null);
  const hasLoadedInitialRef = useRef(false);
  const hasLoadedImageRef = useRef(false);

  // Load the previously flattened avatar as the base layer (once).
  useEffect(() => {
    if (hasLoadedImageRef.current || !initialImage) return;
    hasLoadedImageRef.current = true;
    const img = new window.Image();
    img.addEventListener('load', () => setBaseImage(img));
    img.src = initialImage;
  }, [initialImage]);

  // Leaving decorate mode drops any cosmetic selection; changing mode collapses
  // any open tool panel.
  useEffect(() => {
    if (mode !== 'decorate') setSelectedCosmetic(null);
    setOpenTool(null);
  }, [mode]);

  const toggleTool = (tool: 'brush' | 'color') =>
    setOpenTool((prev) => (prev === tool ? null : tool));

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
    setPenColor((prev) => (!prev || prev === '#000000' ? pal[0] || '#000000' : prev));
  }, [palette]);

  useEffect(() => {
    if (!hasLoadedInitialRef.current && initialStrokes.length > 0) {
      hasLoadedInitialRef.current = true;
      setLines(withRenderIds(initialStrokes));
    }
  }, [initialStrokes]);

  // Converts a raw canvas pixel position to the fixed drawSize coordinate space.
  const toDrawSpace = (x: number, y: number) => ({
    x: Math.round(x * (drawSize.w / drawStageSize.w) * 10) / 10,
    y: Math.round(y * (drawSize.h / drawStageSize.h) * 10) / 10,
  });

  const onPointerDown = (e: any) => {
    // Drawing is only possible in draw mode; cosmetics are locked here.
    if (mode !== 'draw') return;
    // Interacting with a cosmetic (select/drag) must not start a stroke.
    if (e?.target?.name?.() === 'cosmetic') return;
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    setSelectedCosmetic(null);
    setClearedLines(null);
    setIsDrawing(true);
    isDrawingRef.current = true;
    const p = e.target.getStage().getPointerPosition();
    if (!p) return;
    const dp = toDrawSpace(p.x, p.y);
    const stroke: CanvasStroke = {
      id: nextStrokeId(),
      points: [dp.x, dp.y],
      color: penColor,
      width: penWidth,
    };
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
      setBaseImage(clearedBaseImage);
      setClearedLines(null);
      setClearedBaseImage(null);
      onStrokeEvent?.({
        operation: 'canvas_clear_undone',
        data: { strokes: withoutRenderIds(clearedLines) },
      });
      return;
    }
    const last = lines[lines.length - 1];
    if (!last || last.committed) return;
    setLines((prev) => prev.slice(0, -1));
    onStrokeEvent?.({ operation: 'stroke_undone' });
  };

  const canUndo = lines.some((s) => !s.committed) || (lines.length === 0 && !!clearedLines);

  // Flatten the background + drawing layers to a fixed-size raster; cosmetics
  // stay a separate layer and are submitted as structured placements.
  const buildSubmission = () => ({
    image: flattenStrokesToDataUrl(lines, drawSize.w, backgroundColor, baseImage),
    cosmetics,
  });

  const handleSubmit = async () => {
    await onSubmit(buildSubmission());
  };

  // Force-submit the current drawing when the parent bumps submitSignal (e.g.
  // the draw timer expired), without requiring a button press.
  const lastSubmitSignalRef = useRef(submitSignal);
  useEffect(() => {
    if (submitSignal === undefined) return;
    if (submitSignal === lastSubmitSignalRef.current) return;
    lastSubmitSignalRef.current = submitSignal;
    void onSubmit(buildSubmission());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitSignal]);

  const updateCosmetic = (index: number, next: CosmeticPlacement) => {
    onCosmeticsChange?.(cosmetics.map((c, i) => (i === index ? next : c)));
  };

  const removeCosmetic = (index: number) => {
    onCosmeticsChange?.(cosmetics.filter((_, i) => i !== index));
    setSelectedCosmetic(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const cosmetic = getCosmeticDragData(e.dataTransfer);
    const rect = drawWrapRef.current?.getBoundingClientRect();
    if (!cosmetic || !rect || !onCosmeticsChange) return;
    const dp = toDrawSpace(e.clientX - rect.left, e.clientY - rect.top);
    onCosmeticsChange(applyCosmetic(cosmetics, cosmetic, dp.x, dp.y));
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
      <div
        ref={drawWrapRef}
        className={`${styles.stageWrap} ${styles.square}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
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
            {backgroundColor ? (
              <Rect
                x={0}
                y={0}
                width={drawSize.w}
                height={drawSize.h}
                fill={backgroundColor}
                listening={false}
              />
            ) : null}
            {baseImage ? (
              <KonvaImage
                image={baseImage}
                x={0}
                y={0}
                width={drawSize.w}
                height={drawSize.h}
                listening={false}
              />
            ) : null}
            {lines.map((s) => (
              <Line
                key={s.id}
                points={s.points}
                stroke={s.color}
                strokeWidth={s.width}
                lineCap="round"
              />
            ))}
          </Layer>
          <Layer scaleX={drawScale.x} scaleY={drawScale.y}>
            {cosmetics
              .map((placement, i) => ({ placement, i }))
              .toSorted(
                (a, b) =>
                  (a.placement.category === 'frame' ? 1 : 0) -
                  (b.placement.category === 'frame' ? 1 : 0),
              )
              .map(({ placement, i }) => (
                <CosmeticNode
                  key={`${placement.cosmetic_id}-${i}`}
                  placement={placement}
                  interactive={mode === 'decorate' && placement.category === 'clothing'}
                  selected={selectedCosmetic === i}
                  onSelect={() => setSelectedCosmetic(i)}
                  onChange={(next) => updateCosmetic(i, next)}
                />
              ))}
          </Layer>
        </Stage>
      </div>

      {mode === 'draw' ? (
        <div className={styles.tools}>
          <button
            type="button"
            className={styles.toolBtn}
            aria-expanded={openTool === 'brush'}
            onClick={() => toggleTool('brush')}
          >
            Brush:{' '}
            {penWidth === 2
              ? 'Thin'
              : penWidth === 4
                ? 'Medium'
                : penWidth === 8
                  ? 'Thick'
                  : 'Huge'}
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            aria-expanded={openTool === 'color'}
            onClick={() => toggleTool('color')}
          >
            Color
            <span className={styles.toolSwatch} style={{ background: penColor }} aria-hidden />
          </button>
        </div>
      ) : null}

      {mode === 'background' ? (
        <div className={styles.tools}>
          <button
            type="button"
            className={styles.toolBtn}
            aria-expanded={openTool === 'color'}
            onClick={() => toggleTool('color')}
          >
            Color
            {backgroundColor ? (
              <span
                className={styles.toolSwatch}
                style={{ background: backgroundColor }}
                aria-hidden
              />
            ) : (
              <span className={styles.toolNone}>None</span>
            )}
          </button>
        </div>
      ) : null}

      {mode === 'draw' && openTool === 'brush' ? (
        <div className={`${styles.toolPanel} ${styles.sizeGroup}`}>
          {brushSizes.map((sz) => (
            <Button
              key={sz}
              variant="outline"
              size="sm"
              aria-pressed={penWidth === sz}
              onClick={() => {
                setPenWidth(sz);
                setOpenTool(null);
              }}
            >
              {sz === 2 ? 'Thin' : sz === 4 ? 'Medium' : sz === 8 ? 'Thick' : 'Huge'}
            </Button>
          ))}
        </div>
      ) : null}

      {mode === 'draw' && openTool === 'color' ? (
        <div className={`${styles.toolPanel} ${styles.palette}`}>
          {colors.map((c) => (
            <button
              key={c}
              aria-label={`Color ${c}`}
              className={`${styles.swatch} ${penColor === c ? styles.swatchActive : ''}`}
              style={{ background: c }}
              onClick={() => {
                setPenColor(c);
                setOpenTool(null);
              }}
            />
          ))}
          <label
            className={`${styles.swatch} ${styles.colorPickerLabel} ${!colors.includes(penColor) ? styles.swatchActive : ''}`}
            style={!colors.includes(penColor) ? { background: penColor } : undefined}
            aria-label="Custom color"
            title="Custom color"
          >
            <input
              type="color"
              aria-label="Custom color"
              className={styles.hiddenColorInput}
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
            />
          </label>
        </div>
      ) : null}

      {mode === 'background' && openTool === 'color' ? (
        <div className={`${styles.toolPanel} ${styles.palette}`}>
          <button
            type="button"
            aria-label="No background"
            aria-pressed={backgroundColor === null}
            className={`${styles.swatch} ${styles.swatchNone} ${backgroundColor === null ? styles.swatchActive : ''}`}
            title="No background"
            onClick={() => {
              setBackgroundColor(null);
              setOpenTool(null);
            }}
          />
          {colors.map((c) => (
            <button
              key={c}
              aria-label={`Background ${c}`}
              aria-pressed={backgroundColor === c}
              className={`${styles.swatch} ${backgroundColor === c ? styles.swatchActive : ''}`}
              style={{ background: c }}
              onClick={() => {
                setBackgroundColor(c);
                setOpenTool(null);
              }}
            />
          ))}
          <label
            className={`${styles.swatch} ${styles.colorPickerLabel} ${backgroundColor && !colors.includes(backgroundColor) ? styles.swatchActive : ''}`}
            style={
              backgroundColor && !colors.includes(backgroundColor)
                ? { background: backgroundColor }
                : undefined
            }
            aria-label="Custom background color"
            title="Custom background color"
          >
            <input
              type="color"
              aria-label="Custom background color"
              className={styles.hiddenColorInput}
              value={backgroundColor ?? '#000000'}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </label>
        </div>
      ) : null}

      <div className={styles.controls}>
        {mode === 'draw' ? (
          <>
            <Button variant="secondary" size="sm" onClick={onUndo} disabled={!canUndo}>
              Undo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (lines.length > 0 || baseImage) {
                  setClearedLines(lines);
                  setClearedBaseImage(baseImage);
                }
                setLines([]);
                setBaseImage(null);
                onStrokeEvent?.({ operation: 'canvas_cleared' });
              }}
            >
              Clear
            </Button>
          </>
        ) : null}
        {selectedCosmetic !== null ? (
          <Button variant="secondary" size="sm" onClick={() => removeCosmetic(selectedCosmetic)}>
            Remove
          </Button>
        ) : null}
        {onBack ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await onSubmit(buildSubmission());
              onBack();
            }}
          >
            Save
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={
              lines.length === 0 && cosmetics.length === 0 && !backgroundColor && !baseImage
            }
          >
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}
