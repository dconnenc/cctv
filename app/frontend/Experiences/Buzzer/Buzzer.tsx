import { useState } from 'react';

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

interface BuzzerProps {
  block: BuzzerBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function Buzzer({ block, viewContext = 'participant' }: BuzzerProps) {
  const { experience, monitorView } = useExperience();
  const { submitBuzzerResponse, isLoading } = useSubmitBuzzerResponse();
  const [buzzed, setBuzzed] = useState(block.responses?.user_responded ?? false);

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

  if (viewContext === 'monitor') {
    if (!firstResponse) {
      return (
        <div className={styles.monitorWaiting}>
          <p className={styles.monitorLabel}>{block.payload.label || 'Buzz In'}</p>
          <p className={styles.waitingText}>Waiting…</p>
        </div>
      );
    }

    const sourceView = monitorView ?? experience;
    const allParticipants = [...(sourceView?.participants ?? []), ...(sourceView?.hosts ?? [])];
    const winner = allParticipants.find((p) => p.user_id === firstResponse.user_id);
    const strokes = winner?.avatar?.strokes ?? [];

    return (
      <div className={styles.monitorWinner}>
        <p className={styles.monitorLabel}>{block.payload.label || 'Buzz In'}</p>
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
        <button
          className={styles.buzzerButton}
          onClick={handleBuzz}
          disabled={isLoading}
          aria-label="Buzz in"
        />
      </div>
    );
  }

  return null;
}
