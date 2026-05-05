import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react';

const PUMP_WIDTH = 280;
const PUMP_HEIGHT = 360;
const HANDLE_RADIUS = 28;
const HANDLE_X = PUMP_WIDTH / 2;
const HANDLE_TOP_Y = 36;
const HANDLE_BOTTOM_Y = 280;
const HANDLE_TRAVEL = HANDLE_BOTTOM_Y - HANDLE_TOP_Y;

const BARREL_X = HANDLE_X - 22;
const BARREL_W = 44;
const BARREL_TOP = HANDLE_BOTTOM_Y;
const BARREL_BOTTOM = 320;

const BASE_X = HANDLE_X - 60;
const BASE_W = 120;
const BASE_TOP = BARREL_BOTTOM;
const BASE_BOTTOM = 348;

const SHAFT_W = 12;
const SPRING_RETURN_PX_PER_FRAME = 14;

interface PumpProps {
  onStrokeUnits: (units: number) => void;
  pumpUnits: number;
  disabled?: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function Pump({ onStrokeUnits, pumpUnits, disabled = false }: PumpProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handleY, setHandleY] = useState(HANDLE_TOP_Y);
  const handleYRef = useRef(HANDLE_TOP_Y);
  const draggingRef = useRef(false);
  const lastPointerYRef = useRef(0);
  const dragStartHandleYRef = useRef(HANDLE_TOP_Y);
  const dragStartPointerYRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    handleYRef.current = handleY;
  }, [handleY]);

  const playWoosh = useCallback((intensity: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const decay = 1 - i / data.length;
        data[i] = (Math.random() * 2 - 1) * decay * 0.3;
      }
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18 * intensity, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80 + intensity * 60, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.06 * intensity, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      noise.start();
      osc.stop(ctx.currentTime + 0.18);
      noise.stop(ctx.currentTime + 0.2);
    } catch {
      // best-effort
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== PUMP_WIDTH * dpr) {
      canvas.width = PUMP_WIDTH * dpr;
      canvas.height = PUMP_HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.clearRect(0, 0, PUMP_WIDTH, PUMP_HEIGHT);

    const styles = getComputedStyle(document.documentElement);
    const phosphor = styles.getPropertyValue('--phosphor').trim() || '#c8f060';
    const dim = styles.getPropertyValue('--dim').trim() || '#3a3a3a';
    const ink = styles.getPropertyValue('--black').trim() || '#080808';

    // Base / foot
    ctx.fillStyle = dim;
    ctx.beginPath();
    ctx.moveTo(BASE_X, BASE_TOP);
    ctx.lineTo(BASE_X + BASE_W, BASE_TOP);
    ctx.lineTo(BASE_X + BASE_W - 18, BASE_BOTTOM);
    ctx.lineTo(BASE_X + 18, BASE_BOTTOM);
    ctx.closePath();
    ctx.fill();

    // Barrel
    const barrelGrad = ctx.createLinearGradient(BARREL_X, 0, BARREL_X + BARREL_W, 0);
    barrelGrad.addColorStop(0, dim);
    barrelGrad.addColorStop(0.5, '#5a5a5a');
    barrelGrad.addColorStop(1, dim);
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(BARREL_X, BARREL_TOP, BARREL_W, BARREL_BOTTOM - BARREL_TOP);

    // Shaft (drops down with handle)
    const shaftTop = handleYRef.current;
    const shaftBottom = BARREL_TOP + 16;
    ctx.fillStyle = '#888';
    ctx.fillRect(HANDLE_X - SHAFT_W / 2, shaftTop, SHAFT_W, shaftBottom - shaftTop);

    // Pressure indicator: green band climbing
    const indicatorTop = lerp(HANDLE_BOTTOM_Y - 14, BARREL_TOP + 18, pumpUnits / 100);
    ctx.fillStyle = phosphor;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(BARREL_X + 4, indicatorTop, BARREL_W - 8, BARREL_BOTTOM - indicatorTop - 4);
    ctx.globalAlpha = 1;

    // Hose to balloon
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(BARREL_X + BARREL_W, BARREL_TOP + (BARREL_BOTTOM - BARREL_TOP) * 0.5);
    ctx.bezierCurveTo(
      BARREL_X + BARREL_W + 30,
      BARREL_TOP + 8,
      PUMP_WIDTH - 8,
      BARREL_TOP + 30,
      PUMP_WIDTH - 4,
      BARREL_TOP + 50,
    );
    ctx.stroke();

    // Handle (T-bar)
    ctx.fillStyle = '#222';
    ctx.fillRect(HANDLE_X - 70, handleYRef.current - 14, 140, 18);

    ctx.beginPath();
    ctx.fillStyle = '#444';
    ctx.arc(HANDLE_X, handleYRef.current - 5, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ink;
    ctx.stroke();
  }, [pumpUnits]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  const animateSpringBack = useCallback(() => {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    const step = () => {
      const current = handleYRef.current;
      if (current <= HANDLE_TOP_Y + 0.5) {
        handleYRef.current = HANDLE_TOP_Y;
        setHandleY(HANDLE_TOP_Y);
        animFrameRef.current = null;
        return;
      }
      const next = Math.max(HANDLE_TOP_Y, current - SPRING_RETURN_PX_PER_FRAME);
      handleYRef.current = next;
      setHandleY(next);
      animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    dragStartPointerYRef.current = e.clientY;
    dragStartHandleYRef.current = handleYRef.current;
    lastPointerYRef.current = e.clientY;
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.height / PUMP_HEIGHT;
    const deltaPx = (e.clientY - dragStartPointerYRef.current) / scale;
    const desiredY = dragStartHandleYRef.current + deltaPx;
    const clamped = Math.max(HANDLE_TOP_Y, Math.min(HANDLE_BOTTOM_Y, desiredY));

    const previousY = handleYRef.current;
    if (clamped > previousY) {
      const downwardPx = clamped - previousY;
      const units = (downwardPx / HANDLE_TRAVEL) * 10;
      if (units > 0) {
        onStrokeUnits(units);
        playWoosh(Math.min(1, units / 4));
      }
    }

    handleYRef.current = clamped;
    setHandleY(clamped);
    lastPointerYRef.current = e.clientY;
  };

  const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(e.pointerId);
    animateSpringBack();
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        maxWidth: PUMP_WIDTH,
        height: 'auto',
        aspectRatio: `${PUMP_WIDTH} / ${PUMP_HEIGHT}`,
        cursor: disabled ? 'default' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
