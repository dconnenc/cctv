import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@cctv/core/Button/Button';
import { useMinigameArithmetic } from '@cctv/hooks/useMinigameArithmetic';
import { MinigameArithmeticBlock } from '@cctv/types';

import styles from './MinigameArithmetic.module.scss';

interface MinigameArithmeticProps {
  block: MinigameArithmeticBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

function useCountdown(startedAt: string | null, durationSeconds: number, endedAt: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || endedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt, endedAt]);

  return useMemo(() => {
    if (!startedAt) return durationSeconds;
    const start = new Date(startedAt).getTime();
    const elapsed = Math.floor((now - start) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  }, [now, startedAt, durationSeconds]);
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MinigameArithmetic({
  block,
  viewContext = 'participant',
}: MinigameArithmeticProps) {
  switch (viewContext) {
    case 'monitor':
      return <MonitorView block={block} />;
    case 'manage':
      return <ManageView block={block} />;
    default:
      return <ParticipantView block={block} />;
  }
}

function ParticipantView({ block }: { block: MinigameArithmeticBlock }) {
  const { recordAnswer } = useMinigameArithmetic();
  const { duration_seconds, started_at, ended_at, leaderboard, questions } = block.payload;
  const remaining = useCountdown(started_at, duration_seconds, ended_at);
  const inputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [value, setValue] = useState('');

  // The round is played entirely client-side; reset local progress whenever it
  // (re)starts so a restart returns the player to the first question.
  useEffect(() => {
    setIndex(0);
    setCorrect(0);
    setValue('');
  }, [started_at]);

  useEffect(() => {
    setValue('');
    inputRef.current?.focus();
  }, [index]);

  if (ended_at && leaderboard) {
    return <Leaderboard block={block} />;
  }

  if (!started_at) {
    return (
      <div className={styles.root}>
        <p className={styles.waiting}>Get ready…</p>
      </div>
    );
  }

  const current = questions?.[index];
  const timeUp = remaining <= 0;

  if (!current || timeUp) {
    return (
      <div className={styles.root}>
        <p className={styles.timer}>{formatSeconds(Math.max(0, remaining))}</p>
        <p className={styles.score}>
          {correct} / {index}
        </p>
        <p className={styles.waiting}>
          {timeUp ? "Time's up!" : 'All questions answered. Hold tight!'}
        </p>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (Number.parseInt(value, 10) === current.answer) {
      setCorrect((c) => c + 1);
    }
    // Best-effort record for the server-side leaderboard; never awaited.
    recordAnswer(block.id, current.index, value);
    setIndex((i) => i + 1);
  };

  return (
    <div className={styles.root}>
      <p className={styles.timer}>{formatSeconds(remaining)}</p>
      <p className={styles.score}>
        {correct} / {index}
      </p>
      <p className={styles.prompt}>{current.prompt} = ?</p>
      <form onSubmit={handleSubmit} className={styles.answerForm}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Your answer"
        />
        <Button type="submit" size="lg">
          Submit
        </Button>
      </form>
    </div>
  );
}

function MonitorView({ block }: { block: MinigameArithmeticBlock }) {
  const { duration_seconds, started_at, ended_at, leaderboard } = block.payload;
  const remaining = useCountdown(started_at, duration_seconds, ended_at);

  if (ended_at && leaderboard) {
    return <Leaderboard block={block} />;
  }

  if (!started_at) {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.monitorIndicator}>Arithmetic minigame — get ready</p>
        <p className={styles.monitorTimer}>{formatSeconds(duration_seconds)}</p>
      </div>
    );
  }

  return (
    <div className={styles.monitorRoot}>
      <p className={styles.monitorIndicator}>Arithmetic on phones</p>
      <p className={styles.monitorTimer}>{formatSeconds(remaining)}</p>
    </div>
  );
}

function ManageView({ block }: { block: MinigameArithmeticBlock }) {
  const { started_at, ended_at, duration_seconds, question_count, questions, leaderboard } =
    block.payload;
  const remaining = useCountdown(started_at, duration_seconds, ended_at);
  const submissionTotal = block.responses?.total ?? 0;
  const correctTotal = block.responses?.correct_count ?? 0;
  const participantCounts = block.responses?.participant_counts ?? {};
  const playerCount = Object.keys(participantCounts).length;

  const status = !started_at ? 'queued' : ended_at ? 'ended' : 'running';

  return (
    <div className={styles.manageRoot}>
      <p className={styles.manageStat}>
        Status: <strong>{status}</strong>
        {status === 'running' && <> — {formatSeconds(remaining)} remaining</>}
      </p>
      <p className={styles.manageStat}>
        Questions: {question_count} • Players answering: {playerCount} • Total submissions:{' '}
        {submissionTotal} ({correctTotal} correct)
      </p>

      {questions && (
        <div className={styles.questionPreview}>
          {questions.map((q) => (
            <div key={q.index} className={styles.questionPreviewItem}>
              {q.prompt} = {q.answer}
            </div>
          ))}
        </div>
      )}

      {ended_at && leaderboard && <Leaderboard block={block} />}
    </div>
  );
}

function Leaderboard({ block }: { block: MinigameArithmeticBlock }) {
  const entries = block.payload.leaderboard ?? [];

  return (
    <div className={styles.monitorRoot}>
      <p className={styles.leaderboardTitle}>Leaderboard</p>
      <div className={styles.leaderboard}>
        {entries.length === 0 && <p className={styles.waiting}>No submissions — nobody played.</p>}
        {entries.map((entry) => (
          <div key={entry.participant_id} className={styles.leaderboardRow}>
            <span className={styles.leaderboardRank}>#{entry.rank}</span>
            <span className={styles.leaderboardName}>{entry.name}</span>
            <span className={styles.leaderboardScore}>
              {entry.correct} / {entry.completed}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
