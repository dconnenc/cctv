import { ExperienceParticipant } from '@cctv/types';

import styles from './ParticipantsList.module.scss';

interface ParticipantsListProps {
  participants: ExperienceParticipant[];
  highlightUserId?: string;
  showRole?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ParticipantsList({
  participants,
  highlightUserId,
  showRole = false,
  compact = false,
  className,
}: ParticipantsListProps) {
  const cls = `${styles.list} ${compact ? styles.compact : ''} ${className || ''}`.trim();

  return (
    <ul className={cls}>
      {participants.map((p) => {
        const isCurrent = highlightUserId && p.user_id === highlightUserId;
        return (
          <li key={p.id} className={styles.item}>
            <span className={`${styles.name} ${isCurrent ? styles.current : ''}`}>
              {p.name || p.email}
              {isCurrent ? <span className={styles.you}>(You)</span> : null}
            </span>
            {showRole && <span className={styles.role}>{p.role}</span>}
          </li>
        );
      })}
    </ul>
  );
}
