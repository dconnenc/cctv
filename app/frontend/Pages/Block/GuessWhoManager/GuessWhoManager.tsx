import { useMemo } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core/Button/Button';
import { useGuessWhoControls } from '@cctv/hooks/useGuessWhoControls';
import { GuessWhoBlock, GuessWhoContestant, GuessWhoMonitorView } from '@cctv/types';

import styles from './GuessWhoManager.module.scss';

interface GuessWhoManagerProps {
  block: GuessWhoBlock;
}

const MONITOR_VIEWS: { value: GuessWhoMonitorView; label: string }[] = [
  { value: 'idle', label: 'Idle' },
  { value: 'c1_clue', label: 'C1 Clue' },
  { value: 'c1_board', label: 'C1 Board' },
  { value: 'c2_clue', label: 'C2 Clue' },
  { value: 'c2_board', label: 'C2 Board' },
  { value: 'reveal', label: 'Reveal' },
];

function ContestantPanel({
  block,
  contestant,
  index,
}: {
  block: GuessWhoBlock;
  contestant: GuessWhoContestant;
  index: 0 | 1;
}) {
  const { rerollMystery, advanceClue, curateClues, dispatchPoll, concludePoll, isLoading } =
    useGuessWhoControls();

  const visibleClues = contestant.clues.filter((c) => !c.hidden);
  const totalClues = contestant.clues.length;
  const activePollForThis =
    block.payload.active_poll_block_id && block.payload.active_poll_contestant_index === index;
  const isAnyPollActive = !!block.payload.active_poll_block_id;
  const responded = block.payload.active_poll_response_count ?? 0;
  const total = block.payload.active_poll_total_participants ?? 0;

  const toggleHidden = async (clueId: string) => {
    const hidden = new Set(contestant.clues.filter((c) => c.hidden).map((c) => c.id));
    if (hidden.has(clueId)) hidden.delete(clueId);
    else hidden.add(clueId);
    await curateClues(
      block.id,
      index,
      contestant.clues.map((c) => c.id),
      Array.from(hidden),
    );
  };

  const moveClue = async (clueId: string, delta: -1 | 1) => {
    const order = contestant.clues.map((c) => c.id);
    const i = order.indexOf(clueId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    const hidden = contestant.clues.filter((c) => c.hidden).map((c) => c.id);
    await curateClues(block.id, index, order, hidden);
  };

  return (
    <section className={styles.contestantPanel} aria-label={`Contestant ${index + 1}`}>
      <header className={styles.contestantHeader}>
        <div>
          <span className={styles.label}>Contestant {index + 1}</span>
          <strong>{contestant.contestant?.name ?? 'Unassigned'}</strong>
        </div>
        <div>
          <span className={styles.label}>Mystery</span>
          <strong>{contestant.mystery?.name ?? 'Unassigned'}</strong>
        </div>
        <Button
          variant="secondary"
          onClick={() => rerollMystery(block.id, index)}
          disabled={isLoading}
        >
          Reroll mystery
        </Button>
      </header>

      <div className={styles.cluesSection}>
        <div className={styles.cluesHeader}>
          <span>
            Clues ({visibleClues.length} visible / {totalClues} total)
          </span>
          <div>
            <Button
              variant="secondary"
              onClick={() => advanceClue(block.id, index, -1)}
              disabled={isLoading || contestant.current_clue_index <= 0}
            >
              ← Prev
            </Button>
            <Button
              variant="secondary"
              onClick={() => advanceClue(block.id, index, 1)}
              disabled={isLoading || contestant.current_clue_index >= visibleClues.length - 1}
            >
              Next →
            </Button>
          </div>
        </div>

        <ol className={styles.cluesList}>
          {contestant.clues.map((clue, i) => (
            <li
              key={clue.id}
              className={`${styles.clueRow} ${clue.hidden ? styles.clueHidden : ''} ${
                i === contestant.current_clue_index && !clue.hidden ? styles.clueCurrent : ''
              }`}
            >
              <div className={styles.cluePromptColumn}>
                <div className={styles.cluePrompt}>{clue.prompt || 'Submission'}</div>
                <div className={styles.clueAnswer}>{clue.answer?.text || '—'}</div>
              </div>
              <div className={styles.clueControls}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveClue(clue.id, -1)}
                  disabled={isLoading || i === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveClue(clue.id, 1)}
                  disabled={isLoading || i === contestant.clues.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleHidden(clue.id)}
                  disabled={isLoading}
                >
                  {clue.hidden ? 'Show' : 'Hide'}
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.pollSection}>
        {activePollForThis ? (
          <>
            <span>
              Poll responses: {responded} / {total}
            </span>
            <Button onClick={() => concludePoll(block.id)} disabled={isLoading}>
              Conclude poll
            </Button>
          </>
        ) : (
          <Button
            onClick={() => dispatchPoll(block.id, index)}
            disabled={isLoading || isAnyPollActive}
          >
            Dispatch T/F poll
          </Button>
        )}
      </div>

      <div className={styles.boardSummary}>
        Eliminated: {contestant.eliminated_user_ids.length} · Unanswered:{' '}
        {contestant.unanswered_user_ids.length} · Remaining:{' '}
        {contestant.board_candidate_ids.length - contestant.eliminated_user_ids.length}
      </div>
    </section>
  );
}

export default function GuessWhoManager({ block }: GuessWhoManagerProps) {
  const { experience } = useExperience();
  const { start, setMonitorView, reveal, isLoading } = useGuessWhoControls();

  const contestantSegment = useMemo(
    () => experience?.segments?.find((s) => s.id === block.payload.contestant_segment_id),
    [experience, block.payload.contestant_segment_id],
  );

  const contestantParticipants = useMemo(() => {
    if (!contestantSegment) return [];
    const all = [...(experience?.hosts || []), ...(experience?.participants || [])];
    return all.filter((p) => p.segments?.includes(contestantSegment.name));
  }, [contestantSegment, experience]);

  const started = block.payload.started ?? false;
  const contestants = block.payload.contestants ?? [];
  const currentView = block.payload.monitor_view ?? 'idle';

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>Guess Who</h2>

      <section className={styles.section}>
        <h3>Contestants segment</h3>
        {contestantSegment ? (
          <p>
            <strong>{contestantSegment.name}</strong> — currently {contestantParticipants.length}{' '}
            member{contestantParticipants.length === 1 ? '' : 's'}:{' '}
            {contestantParticipants.map((p) => p.name).join(', ') || '(none assigned yet)'}
          </p>
        ) : (
          <p>No contestant segment configured.</p>
        )}
        {!started && (
          <Button
            onClick={() => start(block.id)}
            disabled={isLoading || contestantParticipants.length !== 2}
          >
            Start game
          </Button>
        )}
      </section>

      {started && (
        <>
          <section className={styles.section} aria-label="Monitor view">
            <h3>Monitor view</h3>
            <div className={styles.monitorToggle}>
              {MONITOR_VIEWS.map((v) => (
                <Button
                  key={v.value}
                  variant={currentView === v.value ? 'primary' : 'secondary'}
                  onClick={() => setMonitorView(block.id, v.value)}
                  disabled={isLoading}
                >
                  {v.label}
                </Button>
              ))}
            </div>
          </section>

          <div className={styles.contestantsRow}>
            {contestants.map((c, i) => (
              <ContestantPanel key={i} block={block} contestant={c} index={i as 0 | 1} />
            ))}
          </div>

          {!block.payload.revealed && (
            <Button onClick={() => reveal(block.id)} disabled={isLoading}>
              Reveal
            </Button>
          )}
        </>
      )}
    </div>
  );
}
