import { useEffect, useMemo, useRef, useState } from 'react';

import { Layer, Line, Stage } from 'react-konva';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core/Button/Button';
import { useBalloonPumpLeader, useMinigameBalloonPump } from '@cctv/hooks/useMinigameBalloonPump';
import { MinigameBalloonPumpBlock, MinigameBalloonPumpPodiumEntry } from '@cctv/types';

import Balloon from './Balloon';
import Pump from './Pump';

import styles from './MinigameBalloonPump.module.scss';

interface Props {
  block: MinigameBalloonPumpBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

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
  const { target_units, started_at, ended_at, own_fill, winner_participant_ids } = block.payload;
  const [localFill, setLocalFill] = useState(own_fill ?? 0);
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

  // Reconcile with server when own_fill arrives larger than local (e.g. on reconnect).
  useEffect(() => {
    if ((own_fill ?? 0) > localFillRef.current) {
      setLocalFill(own_fill ?? 0);
      localFillRef.current = own_fill ?? 0;
    }
  }, [own_fill]);

  const handlePumpUnits = (units: number) => {
    if (!started_at || ended_at) return;
    if (localFillRef.current >= target_units) return;
    const next = Math.min(target_units, localFillRef.current + units);
    setLocalFill(next);
    localFillRef.current = next;
    submitPump(block.id, Math.round(next));
  };

  const fillRatio = target_units > 0 ? Math.min(1, localFill / target_units) : 0;
  const popped = (ended_at && fillRatio >= 0.999) || false;

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

  if (ended_at) {
    return (
      <div className={styles.root}>
        <div className={styles.balloonStage}>
          <Balloon fillRatio={fillRatio} popped={popped} size={220} />
        </div>
        <p className={styles.endedBanner}>
          {youWon ? 'BURST! You did it.' : 'Game over — see the monitor.'}
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
        <Balloon fillRatio={fillRatio} size={220} />
      </div>
      <div className={styles.pumpStage}>
        <Pump pumpUnits={localFill} onStrokeUnits={handlePumpUnits} disabled={fillRatio >= 1} />
        <p className={styles.pumpHint}>Drag the handle down. Release to spring back.</p>
      </div>
    </div>
  );
}

function MonitorView({ block }: { block: MinigameBalloonPumpBlock }) {
  const { target_units, leader_fill, leader_participant_id, started_at, ended_at, podium } =
    block.payload;

  const leader = useBalloonPumpLeader(block.id, {
    leader_fill,
    target_units,
    leader_participant_id,
  });

  const [popping, setPopping] = useState(false);

  useEffect(() => {
    if (ended_at && !popping) {
      setPopping(true);
      const t = window.setTimeout(() => setPopping(false), 1600);
      return () => window.clearTimeout(t);
    }
  }, [ended_at, popping]);

  const fillRatio = target_units > 0 ? Math.min(1, leader.leader_fill / target_units) : 0;

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
      <p className={styles.monitorTitle}>Closest to popping</p>
      <div className={styles.monitorBalloonStage}>
        <Balloon fillRatio={fillRatio} popped={popping} size={420} />
      </div>
      <p className={styles.monitorPercent}>{Math.round(fillRatio * 100)}%</p>
    </div>
  );
}

function ManageView({ block }: { block: MinigameBalloonPumpBlock }) {
  const { start, end } = useMinigameBalloonPump();
  const { target_units, started_at, ended_at, leader_fill, live_results } = block.payload;
  const status = !started_at ? 'queued' : ended_at ? 'ended' : 'running';

  return (
    <div className={styles.manageRoot}>
      <p className={styles.manageStat}>
        Status: <strong>{status}</strong> • Target: {target_units} units (={' '}
        {(target_units / 10).toFixed(1)} strokes)
      </p>
      <p className={styles.manageStat}>
        Leader fill: {leader_fill ?? 0} (
        {target_units > 0 ? Math.round(((leader_fill ?? 0) / target_units) * 100) : 0}%)
      </p>

      <div className={styles.manageActions}>
        {status === 'queued' && <Button onClick={() => start(block.id)}>Start minigame</Button>}
        {status === 'running' && (
          <Button variant="secondary" onClick={() => end(block.id)}>
            End early
          </Button>
        )}
      </div>

      {live_results && live_results.length > 0 && (
        <div className={styles.liveResults}>
          {live_results.map((r) => (
            <div key={r.participant_id} className={styles.liveResultRow}>
              <span>{r.name}</span>
              <span>{r.fill_amount}</span>
            </div>
          ))}
        </div>
      )}
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

function PodiumAvatar({ entry }: { entry: MinigameBalloonPumpPodiumEntry }) {
  const strokes = entry.avatar?.strokes ?? [];
  if (strokes.length === 0) {
    return <div className={styles.podiumAvatar} />;
  }
  return (
    <div className={styles.podiumAvatar}>
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
  );
}
