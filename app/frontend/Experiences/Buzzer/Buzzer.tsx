import { useCallback, useEffect, useRef, useState } from 'react';

import { Layer, Line, Stage } from 'react-konva';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useSubmitBuzzerResponse } from '@cctv/hooks/useSubmitBuzzerResponse';
import { BuzzerBlock } from '@cctv/types';

import styles from './Buzzer.module.scss';

const DRAW_SIZE = 320;
const AVATAR_DISPLAY_SIZE = 280;
const AVATAR_SCALE = AVATAR_DISPLAY_SIZE / DRAW_SIZE;

function playBuzzerSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // AudioContext not available — silent fail
  }
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
}

const PARTICLE_COLORS = ['#ff4911', '#ff6b3d', '#ffaa00', '#ffe066', '#ffffff'];

function createParticles(cx: number, cy: number): Particle[] {
  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: cx,
    y: cy,
    angle: (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.4,
    speed: 3 + Math.random() * 5,
    size: 4 + Math.random() * 6,
    opacity: 1,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
  }));
}

interface BuzzerProps {
  block: BuzzerBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function Buzzer({ block, viewContext = 'participant' }: BuzzerProps) {
  const { experience, monitorView } = useExperience();
  const { submitBuzzerResponse, isLoading } = useSubmitBuzzerResponse();
  const [buzzed, setBuzzed] = useState(block.responses?.user_responded ?? false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animRef = useRef<number>(0);

  const allResponses = block.responses?.all_responses ?? [];
  const firstResponse = allResponses[0] ?? null;

  const handleBuzz = async () => {
    if (buzzed || isLoading) return;
    playBuzzerSound();
    setBuzzed(true);
    const result = await submitBuzzerResponse(block.id);
    if (!result?.success) {
      setBuzzed(false);
    }
  };

  const spawnExplosion = useCallback((cx: number, cy: number) => {
    setParticles(createParticles(cx, cy));
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;

    const tick = () => {
      setParticles((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + Math.cos(p.angle) * p.speed,
            y: p.y + Math.sin(p.angle) * p.speed,
            speed: p.speed * 0.92,
            opacity: p.opacity - 0.03,
            size: p.size * 0.96,
          }))
          .filter((p) => p.opacity > 0);
        return next;
      });
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [particles.length > 0]);

  if (viewContext === 'monitor') {
    if (!firstResponse) {
      return (
        <div className={styles.monitorWaiting}>
          <p className={styles.monitorLabel}>
            {block.payload.prompt || 'Contestants be ready to buzz in!'}
          </p>
        </div>
      );
    }

    const sourceView = monitorView ?? experience;
    const allParticipants = [...(sourceView?.participants ?? []), ...(sourceView?.hosts ?? [])];
    const winner = allParticipants.find((p) => p.user_id === firstResponse.user_id);
    const strokes = winner?.avatar?.strokes ?? [];

    return (
      <div className={styles.monitorWinner}>
        {strokes.length > 0 ? (
          <div className={styles.avatarWrap}>
            <Stage width={AVATAR_DISPLAY_SIZE} height={AVATAR_DISPLAY_SIZE}>
              <Layer scaleX={AVATAR_SCALE} scaleY={AVATAR_SCALE}>
                {strokes.map((s, i) => (
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
        ) : (
          <div className={styles.avatarPlaceholder} />
        )}
        <p className={styles.winnerName}>{winner?.name ?? 'Unknown'}</p>
      </div>
    );
  }

  if (viewContext === 'participant') {
    if (buzzed) {
      return (
        <div className={styles.buzzedState}>
          <p className={styles.buzzedText}>Buzzed!</p>
        </div>
      );
    }

    return (
      <div className={styles.participantRoot}>
        <p className={styles.label}>{block.payload.label || 'Buzz In'}</p>
        <div className={styles.buzzerArea}>
          <button
            className={styles.buzzerButton}
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              spawnExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
              handleBuzz();
            }}
            disabled={isLoading}
            aria-label="Buzz in"
          />
          {particles.length > 0 && (
            <div className={styles.particleLayer}>
              {particles.map((p) => (
                <div
                  key={p.id}
                  className={styles.particle}
                  style={{
                    left: p.x,
                    top: p.y,
                    width: p.size,
                    height: p.size,
                    opacity: p.opacity,
                    backgroundColor: p.color,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
