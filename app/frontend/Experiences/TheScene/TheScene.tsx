import { FormEvent, useEffect, useMemo, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { Button } from '@cctv/core/Button/Button';
import { PerformerStoriesBar } from '@cctv/core/PerformerStoriesBar/PerformerStoriesBar';
import { useTheScene } from '@cctv/hooks/useTheScene';
import { ExperienceParticipant, TheSceneBlock } from '@cctv/types';

import { BuzzerPanel } from './BuzzerPanel';

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
  const { phase, leaderboard, performers, is_prompt_recipient, is_buzzer_holder, is_performer } =
    block.payload;

  const activeSuggestionCount = leaderboard.length;
  const votingOpen = phase === 'collecting' && activeSuggestionCount >= 2;
  const blockState = submissionState[block.id];
  const own_suggestion = blockState?.own_suggestion ?? null;
  const own_vote_suggestion_id = blockState?.own_vote_suggestion_id ?? null;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(own_suggestion?.text ?? '');

  useEffect(() => {
    if (!own_suggestion) {
      setText('');
      setEditing(false);
    }
  }, [own_suggestion]);

  const votableSuggestions = useMemo(
    () =>
      votingOpen && own_suggestion
        ? leaderboard.filter((s) => s.id !== own_suggestion.id)
        : votingOpen
          ? leaderboard
          : [],
    [votingOpen, own_suggestion, leaderboard],
  );

  const stories = <PerformerStoriesBar performers={performers} />;

  if (phase === 'idle') {
    return (
      <Shell stories={stories}>
        <p className={styles.heading}>Waiting for the next scene…</p>
      </Shell>
    );
  }

  if (phase === 'ended') {
    return (
      <Shell stories={stories}>
        <p className={styles.heading}>Scene ended</p>
        <p className={styles.subheading}>See the monitor for the winning suggestion.</p>
      </Shell>
    );
  }

  if (phase === 'winner_reveal') {
    return (
      <Shell stories={stories}>
        <p className={styles.heading}>Scene ended!</p>
        <p className={styles.subheading}>Watch the monitor for the winning prompt.</p>
      </Shell>
    );
  }

  if (is_performer) {
    return (
      <Shell stories={stories}>
        <p className={styles.heading}>You're on stage</p>
        <p className={styles.subheading}>Sit back — the audience is picking your scene.</p>
      </Shell>
    );
  }

  if (is_buzzer_holder) {
    return (
      <Shell stories={stories}>
        <BuzzerPanel blockId={block.id} activeSuggestionCount={activeSuggestionCount} />
      </Shell>
    );
  }

  // Prompt recipient flows.
  if (is_prompt_recipient) {
    // Show input when no submission yet OR when explicitly editing.
    if (!own_suggestion || editing) {
      const remaining = MAX_SUGGESTION_LENGTH - text.length;
      const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        const result = await submitSuggestion(block.id, trimmed);
        if (result?.success) {
          setEditing(false);
        }
      };

      return (
        <Shell stories={stories}>
          <p className={styles.heading}>{editing ? 'Edit your suggestion' : 'Drop a suggestion'}</p>
          <p className={styles.subheading}>
            {editing
              ? 'Your votes will stick to your suggestion.'
              : 'Make it weird, make it specific.'}
          </p>
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
              {editing ? 'Save' : 'Submit suggestion'}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setText(own_suggestion?.text ?? '');
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            )}
          </form>
        </Shell>
      );
    }

    // Submitted — show voting (or waiting) with edit affordance.
    return (
      <Shell stories={stories}>
        <div className={styles.manageRow}>
          <Button
            variant="ghost"
            onClick={() => {
              setText(own_suggestion.text);
              setEditing(true);
            }}
          >
            ← Edit suggestion
          </Button>
        </div>
        <p className={styles.heading}>{votingOpen ? 'Vote' : "You're in!"}</p>
        <div className={styles.ownSuggestion}>Your suggestion: "{own_suggestion.text}"</div>
        <VotingBody
          blockId={block.id}
          votingOpen={votingOpen}
          activeSuggestionCount={activeSuggestionCount}
          choices={votableSuggestions}
          ownVoteSuggestionId={own_vote_suggestion_id}
          onVote={(id) => void submitVote(block.id, id)}
        />
      </Shell>
    );
  }

  // Non-prompt-recipient (and non-buzzer, non-performer): observer / voter.
  return (
    <Shell stories={stories}>
      <p className={styles.heading}>{votingOpen ? 'Vote' : 'Waiting on suggestions'}</p>
      <VotingBody
        blockId={block.id}
        votingOpen={votingOpen}
        activeSuggestionCount={activeSuggestionCount}
        choices={votableSuggestions}
        ownVoteSuggestionId={own_vote_suggestion_id}
        onVote={(id) => void submitVote(block.id, id)}
      />
    </Shell>
  );
}

function Shell({ stories, children }: { stories: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      {stories}
      <div className={styles.root}>{children}</div>
    </div>
  );
}

function VotingBody({
  votingOpen,
  activeSuggestionCount,
  choices,
  ownVoteSuggestionId,
  onVote,
}: {
  blockId: string;
  votingOpen: boolean;
  activeSuggestionCount: number;
  choices: TheSceneBlock['payload']['leaderboard'];
  ownVoteSuggestionId: string | null;
  onVote: (id: string) => void;
}) {
  if (!votingOpen) {
    return (
      <div className={styles.patience}>
        <span>
          Need {Math.max(0, 2 - activeSuggestionCount)} more suggestion
          {Math.max(0, 2 - activeSuggestionCount) === 1 ? '' : 's'} before voting opens
        </span>
        <span>
          <span className={styles.dotPulse} />
          <span className={styles.dotPulse} />
          <span className={styles.dotPulse} />
        </span>
      </div>
    );
  }

  return (
    <div className={styles.votingList}>
      {choices.length === 0 && (
        <p className={styles.subheading}>No other suggestions yet — hang tight.</p>
      )}
      {choices.map((s) => {
        const active = ownVoteSuggestionId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            className={`${styles.voteRow} ${active ? styles.voteRowActive : ''}`}
            onClick={() => onVote(s.id)}
          >
            <span>{s.text}</span>
            <span className={styles.voteCount}>{s.vote_count}</span>
          </button>
        );
      })}
    </div>
  );
}

const ROW_HEIGHT_PX = 76;

function MonitorView({ block }: { block: TheSceneBlock }) {
  const { phase, leaderboard, leaderboard_size, winner_revealed_at } = block.payload;
  const top = leaderboard.slice(0, leaderboard_size);
  const revealing = phase === 'winner_reveal';

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
      <p className={styles.monitorTitle}>
        {phase === 'ended' ? 'Scene ended' : revealing ? 'And the winner is…' : 'The Scene'}
      </p>
      <p className={styles.monitorPhase}>
        {phase === 'collecting' && 'Live'}
        {revealing && 'Winner reveal'}
        {phase === 'ended' && 'Final results'}
      </p>
      <Leaderboard suggestions={top} reveal={revealing} revealKey={winner_revealed_at} />
    </div>
  );
}

function Leaderboard({
  suggestions,
  reveal,
  revealKey,
}: {
  suggestions: TheSceneBlock['payload']['leaderboard'];
  reveal: boolean;
  revealKey: string | null;
}) {
  const containerHeight = Math.max(suggestions.length * ROW_HEIGHT_PX, ROW_HEIGHT_PX);

  return (
    <div className={styles.monitorLeaderboard} style={{ height: containerHeight }}>
      {suggestions.map((s, index) => {
        const isWinner = reveal && s.rank === 1;
        return (
          <div
            key={s.id}
            className={`${styles.leaderboardRow} ${isWinner ? styles.leaderboardWinner : ''}`}
            data-rank={s.rank}
            data-reveal-key={isWinner ? (revealKey ?? '') : undefined}
            style={{ top: `${index * ROW_HEIGHT_PX}px` }}
          >
            <span className={styles.leaderboardRank}>#{s.rank}</span>
            <span className={styles.leaderboardText}>{s.text}</span>
            <span className={styles.leaderboardVotes}>{s.vote_count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ManageView({ block }: { block: TheSceneBlock }) {
  const { experience } = useExperience();
  const {
    startScene,
    endScene,
    forceNextScene,
    updatePerformers,
    clearTop,
    clearAll,
    clearSuggestion,
  } = useTheScene();

  const {
    phase,
    prompt_participant_ids = [],
    buzzer_participant_id,
    performer_participant_ids = [],
    performers: performerSummaries = [],
    all_suggestions = [],
  } = block.payload;

  const participants = useMemo(() => {
    if (!experience) return [] as ExperienceParticipant[];
    return [...(experience.hosts || []), ...(experience.participants || [])];
  }, [experience]);

  const participantById = useMemo(() => {
    const map = new Map<string, ExperienceParticipant>();
    participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [participants]);

  const performerProfileUserIds = useMemo(
    () => new Set(performerSummaries.filter((p) => p.has_performer_profile).map((p) => p.user_id)),
    [performerSummaries],
  );

  const sortedParticipants = useMemo(() => {
    const eligible = participants.filter((p) => p.role !== 'host' && p.role !== 'moderator');
    return eligible.slice().sort((a, b) => {
      const aHas = performerProfileUserIds.has(a.user_id) ? 0 : 1;
      const bHas = performerProfileUserIds.has(b.user_id) ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      return a.name.localeCompare(b.name);
    });
  }, [participants, performerProfileUserIds]);

  const totalVotes = useMemo(
    () => all_suggestions.reduce((sum, s) => sum + s.vote_count, 0),
    [all_suggestions],
  );

  const togglePerformer = (participantId: string) => {
    const next = performer_participant_ids.includes(participantId)
      ? performer_participant_ids.filter((id) => id !== participantId)
      : [...performer_participant_ids, participantId];
    void updatePerformers(block.id, next);
  };

  const promptNames = prompt_participant_ids
    .map((id) => participantById.get(id)?.name ?? id.slice(0, 6))
    .join(', ');
  const buzzerName = buzzer_participant_id
    ? (participantById.get(buzzer_participant_id)?.name ?? buzzer_participant_id.slice(0, 6))
    : '—';

  return (
    <div className={styles.manageRoot}>
      <p className={styles.manageStat}>
        Phase: <strong>{phase}</strong> • Active suggestions: {all_suggestions.length} • Votes this
        scene: {totalVotes}
      </p>

      <p className={styles.manageStat}>
        Prompt recipients: <strong>{promptNames || '—'}</strong> • Buzzer:{' '}
        <strong>{buzzerName}</strong>
      </p>

      <div className={styles.manageRow}>
        {phase === 'idle' && <Button onClick={() => startScene(block.id)}>Start scene</Button>}
        {phase === 'collecting' && (
          <>
            <Button onClick={() => forceNextScene(block.id)}>Force next scene</Button>
            <Button variant="secondary" onClick={() => endScene(block.id)}>
              End block
            </Button>
          </>
        )}
        {phase === 'winner_reveal' && (
          <>
            <Button onClick={() => forceNextScene(block.id)}>Skip wait → next scene</Button>
            <Button variant="secondary" onClick={() => endScene(block.id)}>
              End block
            </Button>
          </>
        )}
        {phase === 'ended' && <Button onClick={() => startScene(block.id)}>Restart scene</Button>}
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

      <details className={styles.performersConfig}>
        <summary>Performers ({performer_participant_ids.length})</summary>
        <div className={styles.performerList}>
          {sortedParticipants.map((p) => {
            const selected = performer_participant_ids.includes(p.id);
            const hasProfile = performerProfileUserIds.has(p.user_id);
            return (
              <label key={p.id} className={styles.performerRow}>
                <input type="checkbox" checked={selected} onChange={() => togglePerformer(p.id)} />
                <span>{p.name}</span>
                {hasProfile && <span className={styles.performerBadge}>Performer</span>}
              </label>
            );
          })}
          {sortedParticipants.length === 0 && (
            <p className={styles.subheading}>No eligible participants.</p>
          )}
        </div>
      </details>

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
