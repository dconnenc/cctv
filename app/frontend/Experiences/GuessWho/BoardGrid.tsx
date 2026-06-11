import { useMemo } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { GuessWhoContestant } from '@cctv/types';

import Avatar from './Avatar';

import styles from './GuessWho.module.scss';

interface BoardGridProps {
  contestant: GuessWhoContestant;
}

// Four rows of eight fit comfortably on the monitor. When there are more
// candidates than that, the final tile becomes an "and N more" overflow marker.
const MAX_TILES = 32;
const AVATAR_SIZE = 48;

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

  const remainingIds = contestant.board_candidate_ids.filter((uid) => !eliminated.has(uid));
  const hasOverflow = remainingIds.length > MAX_TILES;
  const visibleIds = hasOverflow ? remainingIds.slice(0, MAX_TILES - 1) : remainingIds;
  const overflowCount = remainingIds.length - visibleIds.length;

  return (
    <div className={styles.board}>
      {visibleIds.map((uid) => {
        const p = participantsByUserId.get(uid);
        const isUnanswered = unanswered.has(uid);

        return (
          <div key={uid} className={styles.boardCell}>
            <div className={styles.boardAvatarWrap}>
              <Avatar strokes={p?.avatar?.strokes ?? null} size={AVATAR_SIZE} />
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
      {hasOverflow && (
        <div className={`${styles.boardCell} ${styles.boardCellMore}`}>
          and {overflowCount} more {overflowCount === 1 ? 'user' : 'users'}…
        </div>
      )}
    </div>
  );
}
