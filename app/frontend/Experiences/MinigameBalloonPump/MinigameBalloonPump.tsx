import { useEffect, useMemo, useRef, useState } from 'react';

import { Layer, Line, Stage } from 'react-konva';

import {
  BalloonPumpLeaderState,
  useDispatchRegistry,
} from '@cctv/contexts/DispatchRegistryContext';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { useMinigameBalloonPump } from '@cctv/hooks/useMinigameBalloonPump';
import { useSoundEffect } from '@cctv/sounds';
import {
  AvatarStroke,
  MinigameBalloonPumpBlock,
  MinigameBalloonPumpPodiumEntry,
} from '@cctv/types';

import Balloon from './Balloon';
import Pump from './Pump';

import styles from './MinigameBalloonPump.module.scss';

interface Props {
  block: MinigameBalloonPumpBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

// The participant balloon grows to roughly fill the screen at full inflation.
const PARTICIPANT_BALLOON_MAX_SCALE = 3.2;

export default function MinigameBalloonPump({ block, viewContext = 'participant' }: Props) {
  switch (viewContext) {
    case 'monitor':
      return <MonitorView block={block} />;
    case 'manage':
      return <ManageView block={block} />;
    default:
      return <ParticipantView block={block} />;
  }
}

function ParticipantView({ block }: { block: MinigameBalloonPumpBlock }) {
  const { submitPump } = useMinigameBalloonPump();
  const { participant } = useExperience();
  const { submissionState } = useExperienceState();
  const { target_units, started_at, ended_at, winner_participant_ids } = block.payload;
  const [localFill, setLocalFill] = useState(submissionState[block.id]?.fill_amount ?? 0);
  const localFillRef = useRef(localFill);

  useEffect(() => {
    localFillRef.current = localFill;
  }, [localFill]);

  // Reset on game (re)start.
  useEffect(() => {
    if (!started_at) {
      setLocalFill(0);
      localFillRef.current = 0;
    }
  }, [started_at]);

  const handlePumpUnits = (units: number) => {
    if (!started_at || ended_at) return;
    if (localFillRef.current >= target_units) return;
    const next = Math.min(target_units, localFillRef.current + units);
    setLocalFill(next);
    localFillRef.current = next;
    submitPump(block.id, Math.round(next));
  };

  const fillRatio = target_units > 0 ? Math.min(1, localFill / target_units) : 0;
  // Burst the moment this player fills up — don't wait for the server to
  // confirm the game ended, which adds a visible round-trip lag.
  const reachedTarget = fillRatio >= 0.999;
  const popped = reachedTarget;

  // Pop sound plays from the player's own device the moment their balloon bursts.
  useSoundEffect('balloon_pop', popped);

  const youWon = useMemo(() => {
    if (!ended_at || !participant) return false;
    return winner_participant_ids.includes(participant.id);
  }, [ended_at, participant, winner_participant_ids]);

  if (!started_at) {
    return (
      <div className={styles.root}>
        <p className={styles.waiting}>Get ready to pump…</p>
      </div>
    );
  }

  if (ended_at || reachedTarget) {
    return (
      <div className={styles.root}>
        <div className={styles.balloonStage}>
          <Balloon
            fillRatio={fillRatio}
            popped={popped}
            size={220}
            maxScale={PARTICIPANT_BALLOON_MAX_SCALE}
          />
        </div>
        <p className={styles.endedBanner}>
          {reachedTarget || youWon ? 'BURST! You did it.' : 'Game over — see the monitor.'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.fillLabel}>
          {Math.round(localFill)} / {target_units}
        </span>
        <span className={styles.targetLabel}>{Math.round(fillRatio * 100)}% inflated</span>
      </div>
      <div className={styles.balloonStage}>
        <Balloon fillRatio={fillRatio} size={220} maxScale={PARTICIPANT_BALLOON_MAX_SCALE} />
      </div>
      <div className={styles.pumpStage}>
        <Pump pumpUnits={localFill} onStrokeUnits={handlePumpUnits} disabled={fillRatio >= 1} />
        <p className={styles.pumpHint}>Drag the handle down. Release to spring back.</p>
      </div>
    </div>
  );
}

function MonitorView({ block }: { block: MinigameBalloonPumpBlock }) {
  const { started_at, ended_at, podium } = block.payload;

  if (!started_at) {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.monitorTitle}>Balloon Pump — get ready</p>
      </div>
    );
  }

  if (ended_at && podium && podium.length > 0) {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.monitorTitle}>BURST!</p>
        <Podium podium={podium} />
      </div>
    );
  }

  return (
    <div className={styles.monitorRoot}>
      <p className={styles.monitorTitle}>Pump to fill your balloon!</p>
    </div>
  );
}

function ManageView({ block }: { block: MinigameBalloonPumpBlock }) {
  const { target_units, started_at, ended_at } = block.payload;
  const { registerBalloonPumpLeaderDispatch, unregisterBalloonPumpLeaderDispatch } =
    useDispatchRegistry();
  const [leaderState, setLeaderState] = useState<BalloonPumpLeaderState>({ leader_fill: 0 });
  const status = !started_at ? 'queued' : ended_at ? 'ended' : 'running';

  useEffect(() => {
    registerBalloonPumpLeaderDispatch(block.id, setLeaderState);
    return () => unregisterBalloonPumpLeaderDispatch(block.id);
  }, [block.id, registerBalloonPumpLeaderDispatch, unregisterBalloonPumpLeaderDispatch]);

  useEffect(() => {
    if (!started_at) setLeaderState({ leader_fill: 0 });
  }, [started_at]);

  const displayLeaderFill = ended_at
    ? (block.payload.leader_fill ?? leaderState.leader_fill)
    : leaderState.leader_fill;

  return (
    <div className={styles.manageRoot}>
      <p className={styles.manageStat}>
        Status: <strong>{status}</strong> • Target: {target_units} units (={' '}
        {(target_units / 10).toFixed(1)} strokes)
      </p>
      <p className={styles.manageStat}>
        Leader fill: {displayLeaderFill} (
        {target_units > 0 ? Math.round((displayLeaderFill / target_units) * 100) : 0}%)
      </p>
    </div>
  );
}

function Podium({ podium }: { podium: MinigameBalloonPumpPodiumEntry[] }) {
  const order: Array<1 | 2 | 3> = [2, 1, 3];
  const byPlace = new Map<1 | 2 | 3, MinigameBalloonPumpPodiumEntry[]>();
  podium.forEach((entry) => {
    const place = entry.place;
    const list = byPlace.get(place) ?? [];
    list.push(entry);
    byPlace.set(place, list);
  });

  return (
    <div className={styles.podium}>
      {order.map((place) => {
        const entries = byPlace.get(place);
        if (!entries || entries.length === 0) return null;
        return (
          <div key={place} className={styles.podiumColumn}>
            <span className={styles.podiumPlace} data-place={place}>
              {place === 1 ? 'GOLD' : place === 2 ? 'SILVER' : 'BRONZE'}
            </span>
            {entries.map((entry) => (
              <div key={entry.participant_id} className={styles.podiumColumn}>
                <PodiumAvatar entry={entry} />
                <span className={styles.podiumName}>{entry.name}</span>
              </div>
            ))}
            <div className={styles.podiumPlatform} data-place={place}>
              #{place}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const AVATAR_DRAW_SIZE = 320;
const AVATAR_DISPLAY_SIZE = 112;
const AVATAR_SCALE = AVATAR_DISPLAY_SIZE / AVATAR_DRAW_SIZE;

interface IdentifiedStroke {
  id: string;
  stroke: AvatarStroke;
}

// Strokes carry no id, so identity comes from the drawn geometry plus an
// occurrence counter that keeps repeated identical marks distinct.
function identifyStrokes(strokes: AvatarStroke[]): IdentifiedStroke[] {
  const occurrences = new Map<string, number>();
  return strokes.map((stroke) => {
    const drawn = `${stroke.color}:${stroke.width}:${stroke.points.join(',')}`;
    const occurrence = occurrences.get(drawn) ?? 0;
    occurrences.set(drawn, occurrence + 1);
    return { id: `${drawn}#${occurrence}`, stroke };
  });
}

function PodiumAvatar({ entry }: { entry: MinigameBalloonPumpPodiumEntry }) {
  const strokes = entry.avatar?.strokes ?? [];
  if (strokes.length === 0) {
    return <div className={styles.podiumAvatar} />;
  }
  return (
    <div className={styles.podiumAvatar}>
      <Stage width={AVATAR_DISPLAY_SIZE} height={AVATAR_DISPLAY_SIZE}>
        <Layer scaleX={AVATAR_SCALE} scaleY={AVATAR_SCALE}>
          {identifyStrokes(strokes).map(({ id, stroke }) => (
            <Line
              key={id}
              points={stroke.points}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              lineCap="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
