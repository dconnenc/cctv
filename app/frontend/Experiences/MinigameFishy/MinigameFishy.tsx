import { RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import Avatar from '@cctv/experiences/GuessWho/Avatar';
import type { ExperienceParticipant, MinigameFishyBlock, MinigameFishyStanding } from '@cctv/types';

import FishyStage from './FishyStage';
import { FISHY } from './fishyMath';
import { FishyControl, useFishyInput } from './useFishyInput';
import { FishySummary, useFishySummary } from './useFishyWorld';

import styles from './MinigameFishy.module.scss';

interface Props {
  block: MinigameFishyBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

const PODIUM_AVATAR_SIZE = 112;

export default function MinigameFishy({ block, viewContext = 'participant' }: Props) {
  switch (viewContext) {
    case 'monitor':
      return <MonitorView block={block} />;
    case 'manage':
      return <ManageView block={block} />;
    default:
      return <ParticipantView block={block} />;
  }
}

function useParticipants(
  viewContext: 'participant' | 'monitor' | 'manage',
): ExperienceParticipant[] {
  const { experience, monitorView } = useExperience();
  const source =
    viewContext === 'monitor' ? (monitorView ?? experience) : (experience ?? monitorView);
  return source?.participants ?? [];
}

function useParticipantLookup(participants: ExperienceParticipant[]) {
  return useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants]);
}

/** Seconds until play begins (0 once started). */
function useCountdown(startedAt: string | null, endedAt: string | null): number {
  const [now, setNow] = useState(() => Date.now());
  const startsAt = startedAt ? Date.parse(startedAt) : null;
  const counting = startsAt !== null && !endedAt && now < startsAt;

  useEffect(() => {
    if (!counting) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [counting]);

  if (startsAt === null) return 0;
  return Math.max(0, Math.ceil((startsAt - now) / 1000));
}

function ParticipantView({ block }: { block: MinigameFishyBlock }) {
  const { participant } = useExperience();
  const participants = useParticipants('participant');
  const byId = useParticipantLookup(participants);
  const { title, instructions, started_at, ended_at, roster } = block.payload;
  const ownSlot = participant ? roster.indexOf(participant.id) : -1;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const countdown = useCountdown(started_at, ended_at);
  const [summary, setSummary] = useState<FishySummary | null>(null);

  useEffect(() => setSummary(null), [started_at]);

  const eatenBy = summary?.ownEatenBy ?? null;
  const playing = ownSlot >= 0 && eatenBy === null && !ended_at;
  const { controlRef, handlers } = useFishyInput({
    blockId: block.id,
    startedAt: started_at,
    enabled: playing && countdown === 0,
    surfaceRef,
  });

  if (!started_at) {
    return (
      <div className={styles.root}>
        <div className={styles.waiting}>
          <p className={styles.waitingTitle}>{title}</p>
          {instructions && <p className={styles.instructions}>{instructions}</p>}
          <p className={styles.waitingHint}>Get ready…</p>
        </div>
      </div>
    );
  }

  if (ended_at) {
    return (
      <div className={styles.root}>
        <Results block={block} byId={byId} ownId={participant?.id ?? null} />
      </div>
    );
  }

  const eaterName = eatenBy !== null ? byId.get(roster[eatenBy])?.name : undefined;

  return (
    <div className={styles.root}>
      <FishyStage
        block={block}
        participants={participants}
        mode={playing ? 'follow' : 'overview'}
        ownSlot={ownSlot >= 0 ? ownSlot : null}
        control={controlRef}
        onSummary={setSummary}
        rootRef={surfaceRef}
        handlers={handlers}
        className={styles.participantStage}
      />
      <div className={styles.hud}>
        <span className={styles.hudStat}>{summary?.alive ?? roster.length} swimming</span>
        {playing && <DashMeter controlRef={controlRef} />}
      </div>
      {countdown > 0 && <div className={styles.countdown}>{countdown}</div>}
      {eatenBy !== null && (
        <output className={styles.eatenBanner}>
          Eaten{eaterName ? ` by ${eaterName}` : ''} — spectating
        </output>
      )}
      {ownSlot < 0 && <output className={styles.spectatorBanner}>Spectating</output>}
    </div>
  );
}

/** Cooldown ring driven from the animation loop so it never re-renders React. */
function DashMeter({ controlRef }: { controlRef: RefObject<FishyControl> }) {
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const remaining = controlRef.current.dashReadyAt - performance.now() / 1000;
      const progress = 1 - Math.max(0, remaining) / FISHY.dashCooldownSeconds;
      ringRef.current?.style.setProperty('--progress', String(progress));
      ringRef.current?.toggleAttribute('data-ready', progress >= 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controlRef]);

  return (
    <div ref={ringRef} className={styles.dashMeter} aria-label="Dash cooldown">
      <span>Dash</span>
    </div>
  );
}

function MonitorView({ block }: { block: MinigameFishyBlock }) {
  const participants = useParticipants('monitor');
  const byId = useParticipantLookup(participants);
  const { title, instructions, started_at, ended_at, roster } = block.payload;
  const countdown = useCountdown(started_at, ended_at);
  const [summary, setSummary] = useState<FishySummary | null>(null);

  if (!started_at) {
    return (
      <div className={styles.monitorWaiting}>
        <p className={styles.monitorTitle}>{title}</p>
        {instructions && <p className={styles.monitorInstructions}>{instructions}</p>}
      </div>
    );
  }

  if (ended_at) {
    return (
      <div className={styles.monitorWaiting}>
        <Results block={block} byId={byId} ownId={null} />
      </div>
    );
  }

  return (
    <div className={styles.monitorRoot}>
      <FishyStage
        block={block}
        participants={participants}
        mode="overview"
        onSummary={setSummary}
        className={styles.monitorStage}
      />
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>{title}</p>
        <p className={styles.sidebarStat}>{summary?.alive ?? roster.length} swimming</p>
        <ol className={styles.leaders}>
          {(summary?.leaders ?? []).map(({ slot, size }) => (
            <li key={slot} className={styles.leader}>
              <span>{byId.get(roster[slot])?.name ?? 'Player'}</span>
              <span className={styles.leaderSize}>×{size.toFixed(2)}</span>
            </li>
          ))}
        </ol>
      </aside>
      {countdown > 0 && <div className={styles.countdown}>{countdown}</div>}
    </div>
  );
}

function ManageView({ block }: { block: MinigameFishyBlock }) {
  const participants = useParticipants('manage');
  const byId = useParticipantLookup(participants);
  const { started_at, ended_at, roster, max_players, standings } = block.payload;
  const summary = useFishySummary(block);
  const status = !started_at ? 'queued' : ended_at ? 'ended' : 'running';
  const leaders = ended_at
    ? (standings ?? []).slice(0, 3).map((s) => ({ id: s.participant_id, size: s.size }))
    : summary.leaders.slice(0, 3).map((l) => ({ id: roster[l.slot], size: l.size }));

  return (
    <div className={styles.manageRoot}>
      <p className={styles.manageStat}>
        Status: <strong>{status}</strong> • Player cap: {max_players}
      </p>
      {started_at && (
        <p className={styles.manageStat}>
          {ended_at ? roster.length : summary.alive} / {roster.length} swimming
        </p>
      )}
      {leaders.length > 0 && (
        <ol className={styles.leaders}>
          {leaders.map(({ id, size }) => (
            <li key={id} className={styles.leader}>
              <span>{byId.get(id)?.name ?? 'Player'}</span>
              <span className={styles.leaderSize}>×{size.toFixed(2)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const PLACE_LABELS = ['GOLD', 'SILVER', 'BRONZE'];

function Results({
  block,
  byId,
  ownId,
}: {
  block: MinigameFishyBlock;
  byId: Map<string, ExperienceParticipant>;
  ownId: string | null;
}) {
  const standings = block.payload.standings ?? [];
  const winner = byId.get(block.payload.winner_participant_id ?? '');
  const own = ownId ? standings.find((s) => s.participant_id === ownId) : undefined;
  const podium = standings.slice(0, 3);
  const order = [1, 0, 2].filter((index) => index < podium.length);

  return (
    <div className={styles.results}>
      <p className={styles.resultsTitle}>
        {winner ? `${winner.name} rules the bowl!` : 'Game over'}
      </p>
      {own && (
        <p className={styles.ownPlace}>
          {own.place === 1 ? 'You won!' : `You placed #${own.place}`}
        </p>
      )}
      <div className={styles.podium}>
        {order.map((index) => (
          <PodiumColumn key={podium[index].participant_id} entry={podium[index]} byId={byId} />
        ))}
      </div>
    </div>
  );
}

function PodiumColumn({
  entry,
  byId,
}: {
  entry: MinigameFishyStanding;
  byId: Map<string, ExperienceParticipant>;
}) {
  const participant = byId.get(entry.participant_id);
  return (
    <div className={styles.podiumColumn}>
      <span className={styles.podiumPlace} data-place={entry.place}>
        {PLACE_LABELS[entry.place - 1]}
      </span>
      <div className={styles.podiumAvatar}>
        <Avatar avatar={participant?.avatar} size={PODIUM_AVATAR_SIZE} />
      </div>
      <span className={styles.podiumName}>{participant?.name ?? 'Player'}</span>
      <div className={styles.podiumPlatform} data-place={entry.place}>
        #{entry.place}
      </div>
    </div>
  );
}
