import { Pause, Play, Plus } from 'lucide-react';

import { Button, Panel, Pill } from '@cctv/core';
import { Experience, ExperienceStatus } from '@cctv/types';

import styles from './ExperienceHeader.module.scss';

interface ExperienceHeaderProps {
  experience?: Experience;
  onStart: () => void;
  onPause: () => void;
  isStarting: boolean;
  onCreateBlock: () => void;
}

export default function ExperienceHeader({
  experience,
  onStart,
  onPause,
  isStarting,
  onCreateBlock,
}: ExperienceHeaderProps) {
  if (!experience) return null;

  const isLive = experience.status === 'live';
  const statusLabel = experience.status.charAt(0).toUpperCase() + experience.status.slice(1);

  return (
    <Panel
      headerContent={
        <div className={styles.header}>
          <h3 className={styles.title}>{experience.name}</h3>
          <Pill label={statusLabel} />
        </div>
      }
    >
      <div className={styles.actions}>
        <Button onClick={onCreateBlock}>
          <Plus size={16} />
          <span>Block</span>
        </Button>
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
    </Panel>
  );
}
