import { Pause, Play } from 'lucide-react';

import { Button, Pill } from '@cctv/core';
import { Experience, ExperienceStatus } from '@cctv/types';

import styles from './ExperienceHeader.module.scss';

interface ExperienceHeaderProps {
  experience?: Experience;
  onStart: () => void;
  onPause: () => void;
  isStarting: boolean;
}

export default function ExperienceHeader({
  experience,
  onStart,
  onPause,
  isStarting,
}: ExperienceHeaderProps) {
  if (!experience) return null;

  const isLive = experience.status === 'live';
  const statusLabel = experience.status.charAt(0).toUpperCase() + experience.status.slice(1);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>{experience.name}</h3>
        <Pill label={statusLabel} />
      </div>

      <div className={styles.actions}>
        {isLive ? (
          <Button onClick={onPause} loading={isStarting} loadingText="Pausing...">
            <Pause size={16} />
            <span>Pause</span>
          </Button>
        ) : (
          <Button onClick={onStart} loading={isStarting} loadingText="Starting...">
            <Play size={16} />
            <span>Start</span>
          </Button>
        )}
      </div>

      {experience.description && <p className={styles.description}>{experience.description}</p>}
    </div>
  );
}
