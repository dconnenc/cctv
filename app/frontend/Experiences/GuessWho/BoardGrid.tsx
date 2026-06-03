import { useMemo } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { GuessWhoContestant } from '@cctv/types';

import Avatar from './Avatar';

import styles from './GuessWho.module.scss';

interface BoardGridProps {
  contestant: GuessWhoContestant;
}

export default function BoardGrid({ contestant }: BoardGridProps) {
  const { monitorView, experience } = useExperience();
  const exp = monitorView ?? experience;

  const participantsByUserId = useMemo(() => {
    const map = new Map<string, { name: string; avatar?: { strokes?: any[] } | null }>();
    const all = [...(exp?.hosts || []), ...(exp?.participants || [])];
    for (const p of all) {
      if (p.user_id) map.set(p.user_id, { name: p.name, avatar: p.avatar });
    }
    return map;
  }, [exp]);

  const eliminated = new Set(contestant.eliminated_user_ids);
  const unanswered = new Set(contestant.unanswered_user_ids);

  return (
    <div className={styles.board}>
      {contestant.board_candidate_ids.map((uid) => {
        const p = participantsByUserId.get(uid);
        const isEliminated = eliminated.has(uid);
        const isUnanswered = unanswered.has(uid);

        return (
          <div
            key={uid}
            className={`${styles.boardCell} ${isEliminated ? styles.boardCellEliminated : ''}`}
          >
            <div className={styles.boardAvatarWrap}>
              <Avatar strokes={p?.avatar?.strokes ?? null} size={96} />
              {isUnanswered && (
                <span className={styles.shameBadge} aria-label="Did not respond">
                  ?
                </span>
              )}
            </div>
            <span className={styles.boardLabel}>{p?.name ?? 'Unknown'}</span>
          </div>
        );
      })}
    </div>
  );
}
