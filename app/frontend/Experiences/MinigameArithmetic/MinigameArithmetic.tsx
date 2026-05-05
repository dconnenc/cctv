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
  const { submitAnswer, isSubmitting } = useMinigameArithmetic();
  const { duration_seconds, started_at, ended_at, current_question, score, leaderboard } =
    block.payload;
  const remaining = useCountdown(started_at, duration_seconds, ended_at);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue('');
    inputRef.current?.focus();
  }, [current_question?.index]);

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

  if (!current_question) {
    return (
      <div className={styles.root}>
        <p className={styles.timer}>{formatSeconds(remaining)}</p>
        <p className={styles.score}>
          {score?.correct ?? 0} / {score?.completed ?? 0}
        </p>
        <p className={styles.waiting}>All questions answered. Hold tight!</p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    await submitAnswer(block.id, current_question.index, value);
  };

  return (
    <div className={styles.root}>
      <p className={styles.timer}>{formatSeconds(remaining)}</p>
      <p className={styles.score}>
        {score?.correct ?? 0} / {score?.completed ?? 0}
      </p>
      <p className={styles.prompt}>{current_question.prompt} = ?</p>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isSubmitting}
          aria-label="Your answer"
        />
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
  const { start, end } = useMinigameArithmetic();
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

      <div className={styles.manageActions}>
        {status === 'queued' && <Button onClick={() => start(block.id)}>Start minigame</Button>}
        {status === 'running' && (
          <Button variant="secondary" onClick={() => end(block.id)}>
            End early
          </Button>
        )}
      </div>

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
