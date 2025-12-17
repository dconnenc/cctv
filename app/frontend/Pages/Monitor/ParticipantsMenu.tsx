import { useMemo } from 'react';

import { ParticipantsList } from '@cctv/components';
import { useExperience } from '@cctv/contexts';
import { ExperienceParticipant } from '@cctv/types';

import styles from './ParticipantsMenu.module.scss';

export default function ParticipantsMenu() {
  const { monitorView } = useExperience();

  const participants: ExperienceParticipant[] = useMemo(
    () => [...(monitorView?.hosts || []), ...(monitorView?.participants || [])],
    [monitorView?.hosts, monitorView?.participants],
  );

  const count = participants.length;

  if (!monitorView) return null;

  return (
    <aside className={styles.container} aria-label="Participants in lobby">
      <div className={styles.header}>
        <h4 className={styles.title}>Participants</h4>
        <span className={styles.count}>{count}</span>
      </div>
      <ParticipantsList participants={participants} showRole compact />
    </aside>
  );
}
