import { useMemo } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';

import styles from './ParticipantsMenu.module.scss';

const MAX_VISIBLE = 10;

export default function ParticipantsMenu() {
  const { monitorView } = useExperience();

  const participants = useMemo(
    () => [...(monitorView?.hosts || []), ...(monitorView?.participants || [])].reverse(),
    [monitorView?.hosts, monitorView?.participants],
  );

  const visible = participants.slice(0, MAX_VISIBLE);
  const overflow = participants.length - MAX_VISIBLE;

  if (!monitorView) return null;

  return (
    <aside className={styles.container} aria-label="Participants in lobby">
      <div className={styles.header}>
        <h4 className={styles.title}>Participants</h4>
        <span className={styles.count}>{participants.length}</span>
      </div>
      <ul className={styles.list}>
        {visible.map((p) => (
          <li key={p.id} className={styles.item}>
            <span className={styles.name}>{p.name || p.email}</span>
          </li>
        ))}
        {overflow > 0 && <li className={styles.overflow}>{overflow} More</li>}
      </ul>
    </aside>
  );
}
