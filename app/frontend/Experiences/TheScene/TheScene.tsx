import { FormEvent, useEffect, useMemo, useState } from 'react';

import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { Button } from '@cctv/core/Button/Button';
import { useTheScene } from '@cctv/hooks/useTheScene';
import { TheSceneBlock, TheSceneSuggestion } from '@cctv/types';

import styles from './TheScene.module.scss';

const MAX_SUGGESTION_LENGTH = 100;

interface Props {
  block: TheSceneBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function TheScene({ block, viewContext = 'participant' }: Props) {
  switch (viewContext) {
    case 'monitor':
      return <MonitorView block={block} />;
    case 'manage':
      return <ManageView block={block} />;
    default:
      return <ParticipantView block={block} />;
  }
}

function ParticipantView({ block }: { block: TheSceneBlock }) {
  const { submitSuggestion, submitVote, isSubmitting } = useTheScene();
  const { submissionState } = useExperienceState();
  const { phase } = block.payload;
  const blockState = submissionState[block.id];
  const own_suggestion = blockState?.own_suggestion ?? null;
  const own_vote_suggestion_id = blockState?.own_vote_suggestion_id ?? null;
  const votable_suggestions = useMemo(
    () =>
      phase === 'voting' && own_suggestion
        ? block.payload.leaderboard.filter((s) => s.id !== own_suggestion.id)
        : [],
    [phase, own_suggestion, block.payload.leaderboard],
  );
  const [text, setText] = useState('');

  // Reset local input whenever the user has no active own suggestion (i.e. between scenes / after clear).
  useEffect(() => {
    if (!own_suggestion) setText('');
  }, [own_suggestion]);

  if (phase === 'idle') {
    return (
      <div className={styles.root}>
        <p className={styles.heading}>Waiting for the next scene…</p>
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className={styles.root}>
        <p className={styles.heading}>Scene ended</p>
        <p className={styles.subheading}>See the monitor for the winning suggestion.</p>
      </div>
    );
  }

  // No suggestion yet → input.
  if (!own_suggestion) {
    const remaining = MAX_SUGGESTION_LENGTH - text.length;
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed) return;
      const result = await submitSuggestion(block.id, trimmed);
      if (result?.success) setText('');
    };

    return (
      <div className={styles.root}>
        <p className={styles.heading}>Drop a suggestion</p>
        <p className={styles.subheading}>One per scene. Make it weird, make it specific.</p>
        <form className={styles.suggestionForm} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="text"
            maxLength={MAX_SUGGESTION_LENGTH}
            placeholder="A wedding on the moon…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSubmitting}
            autoFocus
          />
          <span className={styles.charCount}>{remaining} characters left</span>
          <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
            Submit suggestion
          </Button>
        </form>
      </div>
    );
  }

  // Submitted but voting isn't open yet → patience screen.
  if (phase === 'collecting') {
    return (
      <div className={styles.root}>
        <p className={styles.patienceTitle}>You're in!</p>
        <div className={styles.ownSuggestion}>"{own_suggestion.text}"</div>
        <div className={styles.patience}>
          <span>Waiting for the voting to open</span>
          <span>
            <span className={styles.dotPulse} />
            <span className={styles.dotPulse} />
            <span className={styles.dotPulse} />
          </span>
        </div>
      </div>
    );
  }

  // phase === 'voting' and we have own_suggestion → render voting list (excludes own).
  const choices = votable_suggestions ?? [];
  return (
    <div className={styles.root}>
      <p className={styles.heading}>Vote</p>
      <p className={styles.subheading}>Tap to vote. Tap a different one to change your mind.</p>
      <div className={styles.ownSuggestion}>Your suggestion: "{own_suggestion.text}"</div>
      <div className={styles.votingList}>
        {choices.length === 0 && (
          <p className={styles.subheading}>No other suggestions yet — hang tight.</p>
        )}
        {choices.map((s) => {
          const active = own_vote_suggestion_id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={`${styles.voteRow} ${active ? styles.voteRowActive : ''}`}
              onClick={() => submitVote(block.id, s.id)}
            >
              <span>{s.text}</span>
              <span className={styles.voteCount}>{s.vote_count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ROW_HEIGHT_PX = 76;

function MonitorView({ block }: { block: TheSceneBlock }) {
  const { phase, leaderboard, leaderboard_size } = block.payload;
  const top = leaderboard.slice(0, leaderboard_size);

  if (phase === 'idle') {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.monitorTitle}>The Scene</p>
        <p className={styles.monitorPhase}>Waiting for the next scene</p>
      </div>
    );
  }

  return (
    <div className={styles.monitorRoot}>
      <p className={styles.monitorTitle}>{phase === 'ended' ? 'Scene ended' : 'The Scene'}</p>
      <p className={styles.monitorPhase}>
        {phase === 'collecting' && 'Collecting suggestions'}
        {phase === 'voting' && 'Voting'}
        {phase === 'ended' && 'Final results'}
      </p>
      <Leaderboard suggestions={top} />
    </div>
  );
}

function Leaderboard({ suggestions }: { suggestions: TheSceneSuggestion[] }) {
  // Maintain stable index-positions per suggestion id so rows can transition
  // between rank slots smoothly even when their list index changes.
  const containerHeight = Math.max(suggestions.length * ROW_HEIGHT_PX, ROW_HEIGHT_PX);

  return (
    <div className={styles.monitorLeaderboard} style={{ height: containerHeight }}>
      {suggestions.map((s, index) => (
        <div
          key={s.id}
          className={styles.leaderboardRow}
          data-rank={s.rank}
          style={{ top: `${index * ROW_HEIGHT_PX}px` }}
        >
          <span className={styles.leaderboardRank}>#{s.rank}</span>
          <span className={styles.leaderboardText}>{s.text}</span>
          <span className={styles.leaderboardVotes}>{s.vote_count}</span>
        </div>
      ))}
    </div>
  );
}

function ManageView({ block }: { block: TheSceneBlock }) {
  const { advancePhase, nextScene, clearTop, clearAll, clearSuggestion } = useTheScene();
  const { phase, all_suggestions = [] } = block.payload;
  const totalVotes = useMemo(
    () => all_suggestions.reduce((sum, s) => sum + s.vote_count, 0),
    [all_suggestions],
  );

  return (
    <div className={styles.manageRoot}>
      <p className={styles.manageStat}>
        Phase: <strong>{phase}</strong> • Active suggestions: {all_suggestions.length} • Votes this
        scene: {totalVotes}
      </p>

      <div className={styles.manageRow}>
        {phase === 'idle' && (
          <Button onClick={() => advancePhase(block.id, 'collecting')}>Open scene</Button>
        )}
        {phase === 'collecting' && (
          <>
            <Button onClick={() => advancePhase(block.id, 'voting')}>Open voting</Button>
            <Button variant="secondary" onClick={() => advancePhase(block.id, 'ended')}>
              End scene
            </Button>
          </>
        )}
        {phase === 'voting' && (
          <Button variant="secondary" onClick={() => advancePhase(block.id, 'ended')}>
            End scene
          </Button>
        )}
        {phase === 'ended' && <Button onClick={() => nextScene(block.id)}>Next scene</Button>}
      </div>

      <div className={styles.manageRow}>
        <Button
          variant="secondary"
          onClick={() => clearTop(block.id)}
          disabled={all_suggestions.length === 0}
        >
          Clear top
        </Button>
        <Button
          variant="secondary"
          onClick={() => clearAll(block.id)}
          disabled={all_suggestions.length === 0}
        >
          Clear all
        </Button>
      </div>

      {all_suggestions.length > 0 && (
        <div className={styles.manageList}>
          {all_suggestions.map((s) => (
            <div key={s.id} className={styles.manageListRow}>
              <span>#{s.rank}</span>
              <span className={styles.manageListRowText}>{s.text}</span>
              <span>{s.vote_count}</span>
              <Button variant="secondary" onClick={() => clearSuggestion(block.id, s.id)}>
                Clear
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
