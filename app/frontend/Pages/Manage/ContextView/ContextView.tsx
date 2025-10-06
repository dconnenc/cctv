import { useState } from 'react';

import { Button, Dropdown } from '@cctv/core';
import { Experience, ParticipantSummary } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';

import styles from './ContextView.module.scss';

type ViewMode = 'tv' | 'participant';

interface ContextViewProps {
  tvView?: Experience;
  participantView?: Experience;
  participants: ParticipantSummary[];
  selectedParticipantId?: string;
  setSelectedParticipantId: (id: string) => void;
  isConnected: boolean;
}

export default function ContextView({
  tvView,
  participantView,
  participants,
  selectedParticipantId,
  setSelectedParticipantId,
  isConnected,
}: ContextViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tv');

  const currentBlock =
    viewMode === 'tv'
      ? tvView?.blocks.find((block) => block.status === 'open')
      : participantView?.blocks[0];

  const participant = participants.find((p) => p.id === selectedParticipantId);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.toggleButtons}>
          <Button onClick={() => setViewMode('tv')} disabled={viewMode === 'tv'}>
            TV View
          </Button>
          <Button onClick={() => setViewMode('participant')} disabled={viewMode === 'participant'}>
            Participant View
          </Button>
        </div>

        <div className={styles.status}>
          {isConnected ? (
            <span className={styles.connected}>🟢 Live</span>
          ) : (
            <span className={styles.disconnected}>🔴 Not connected</span>
          )}
        </div>
      </div>

      {viewMode === 'participant' && (
        <div className={styles.participantSelector}>
          <Dropdown
            options={participants.map((p) => ({ label: p.name, value: p.id }))}
            value={selectedParticipantId}
            onChange={setSelectedParticipantId}
            label="Viewing as"
          />
        </div>
      )}

      <div className={styles.preview}>
        {currentBlock ? (
          <BlockPreview
            block={currentBlock}
            participant={viewMode === 'participant' ? participant : undefined}
          />
        ) : (
          <div className={styles.emptyState}>
            {viewMode === 'tv' ? 'No block on TV' : 'No block for participant'}
          </div>
        )}
      </div>
    </div>
  );
}
