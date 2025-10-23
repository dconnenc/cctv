import { Pause, Play, Plus } from 'lucide-react';

import { Button, Panel, Pill } from '@cctv/core';
import { Experience, ExperienceStatus } from '@cctv/types';

import styles from './ExperienceControl.module.scss';

interface ExperienceControlProps {
  experience?: Experience;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  isLoading: boolean;
  onCreateBlock: () => void;
}

export default function ExperienceControl({
  experience,
  onStart,
  onPause,
  onResume,
  isLoading,
  onCreateBlock,
}: ExperienceControlProps) {
  if (!experience) return null;

  const statusLabel = experience.status.charAt(0).toUpperCase() + experience.status.slice(1);

  const getActionButton = () => {
    switch (experience.status) {
      case 'draft':
      case 'lobby':
        return (
          <Button onClick={onStart} loading={isLoading} loadingText="Starting...">
            <Play size={16} />
            <span>Start</span>
          </Button>
        );
      case 'live':
        return (
          <Button onClick={onPause} loading={isLoading} loadingText="Pausing...">
            <Pause size={16} />
            <span>Pause</span>
          </Button>
        );
      case 'paused':
        return (
          <Button onClick={onResume} loading={isLoading} loadingText="Resuming...">
            <Play size={16} />
            <span>Resume</span>
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Panel
      title="Control"
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
        {getActionButton()}
      </div>

      {experience.description && <p className={styles.description}>{experience.description}</p>}
    </Panel>
  );
}
