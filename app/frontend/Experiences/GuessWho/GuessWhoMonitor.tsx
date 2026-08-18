import { useEffect, useRef } from 'react';

import { useLoopingMonitorSound, useMonitorSound } from '@cctv/sounds';
import { GuessWhoBlock, GuessWhoContestant } from '@cctv/types';

import Avatar from './Avatar';
import BoardGrid from './BoardGrid';
import PollDonut from './PollDonut';
import Reveal from './Reveal';

import styles from './GuessWho.module.scss';

interface GuessWhoMonitorProps {
  block: GuessWhoBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

function ContestantHeader({ contestant }: { contestant: GuessWhoContestant }) {
  return (
    <div className={styles.contestantHeader}>
      <Avatar avatar={contestant.contestant?.avatar} size={96} />
      <div className={styles.contestantTitle}>
        <span className={styles.contestantLabel}>Contestant</span>
        <span className={styles.contestantName}>{contestant.contestant?.name ?? 'Unassigned'}</span>
      </div>
    </div>
  );
}

function ClueView({ contestant }: { contestant: GuessWhoContestant }) {
  const clues = contestant.clues.filter((c) => !c.hidden);
  const idx = Math.min(Math.max(contestant.current_clue_index, 0), Math.max(clues.length - 1, 0));
  const clue = clues[idx];

  if (!clue) {
    return (
      <div className={styles.slide}>
        <p className={styles.empty}>No clues available for this contestant yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.slide}>
      <div className={styles.meta}>
        <span className={styles.kind}>{clue.block_kind.replace(/_/g, ' ')}</span>
        <span className={styles.counter}>
          {idx + 1} / {clues.length}
        </span>
      </div>
      <div className={styles.prompt}>{clue.prompt || 'Submission'}</div>
      <div className={styles.answer}>
        {clue.photo_url ? (
          <img src={clue.photo_url} alt="Submission" className={styles.photo} />
        ) : (
          <p className={styles.answerText}>{clue.answer?.text || '—'}</p>
        )}
      </div>
    </div>
  );
}

function BoardWithPoll({
  block,
  contestant,
  contestantIndex,
}: {
  block: GuessWhoBlock;
  contestant: GuessWhoContestant;
  contestantIndex: 0 | 1;
}) {
  const { payload } = block;
  const isPollActiveForThis =
    payload.active_poll_block_id && payload.active_poll_contestant_index === contestantIndex;

  return (
    <div className={styles.boardWithPoll}>
      <BoardGrid contestant={contestant} />
      {isPollActiveForThis && (
        <div className={styles.donutOverlay}>
          <PollDonut
            responded={payload.active_poll_response_count ?? 0}
            total={payload.active_poll_total_participants ?? 0}
          />
        </div>
      )}
    </div>
  );
}

export default function GuessWhoMonitor({ block, viewContext = 'monitor' }: GuessWhoMonitorProps) {
  const { payload, sounds } = block;
  const view = payload.monitor_view ?? 'idle';
  const contestants = payload.contestants ?? [];

  const prevActivePollIdRef = useRef<string | null>(null);
  const justConcludedPoll = !!prevActivePollIdRef.current && !payload.active_poll_block_id;
  useEffect(() => {
    prevActivePollIdRef.current = payload.active_poll_block_id ?? null;
  });

  useMonitorSound(sounds?.on_dispatch_poll, !!payload.active_poll_block_id, viewContext);
  useMonitorSound(sounds?.on_conclude_poll, justConcludedPoll, viewContext);
  useMonitorSound(sounds?.on_reveal, view === 'reveal', viewContext);
  useLoopingMonitorSound(
    sounds?.theme,
    payload.theme_music_playing ?? false,
    viewContext,
    payload.theme_music_restart_count,
  );

  if (!payload.started || contestants.length < 2) {
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Guess Who?</h2>
        <p className={styles.empty}>Waiting for the game to start…</p>
      </div>
    );
  }

  if (view === 'reveal' || payload.revealed) {
    return <Reveal contestants={contestants} />;
  }

  if (view === 'idle') {
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Guess Who?</h2>
        <div className={styles.idleRow}>
          {contestants.map((c) => (
            <ContestantHeader key={c.contestant_user_id ?? 'unassigned'} contestant={c} />
          ))}
        </div>
      </div>
    );
  }

  const contestantIndex: 0 | 1 = view.startsWith('c1') ? 0 : 1;
  const contestant = contestants[contestantIndex];
  const isClueView = view.endsWith('clue');

  return (
    <div className={styles.root}>
      <ContestantHeader contestant={contestant} />
      {isClueView ? (
        <ClueView contestant={contestant} />
      ) : (
        <BoardWithPoll block={block} contestant={contestant} contestantIndex={contestantIndex} />
      )}
    </div>
  );
}
