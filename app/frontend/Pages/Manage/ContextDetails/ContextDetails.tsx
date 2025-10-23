import { Button, Dropdown, Panel } from '@cctv/core';
import { Experience, ParticipantSummary } from '@cctv/types';

import styles from './ContextDetails.module.scss';

type ViewMode = 'tv' | 'participant';

interface ContextDetailsProps {
  tvView?: Experience;
  participantView?: Experience;
  participants: ParticipantSummary[];
  selectedParticipantId?: string;
  setSelectedParticipantId: (id: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export default function ContextDetails({
  tvView,
  participantView,
  participants,
  selectedParticipantId,
  setSelectedParticipantId,
  viewMode,
  setViewMode,
}: ContextDetailsProps) {
  const currentBlock =
    viewMode === 'tv'
      ? tvView?.blocks.find((block) => block.status === 'open')
      : participantView?.blocks[0];

  return (
    <Panel title="Details">
      <div className={styles.toggleButtons}>
        <Button onClick={() => setViewMode('tv')} disabled={viewMode === 'tv'}>
          TV View
        </Button>
        <Button onClick={() => setViewMode('participant')} disabled={viewMode === 'participant'}>
          Participant View
        </Button>
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

      {currentBlock && (
        <div className={styles.blockDetails}>
          <h4 className={styles.detailsTitle}>Current Block</h4>
          <div className={styles.detailRow}>
            <span className={styles.label}>Kind:</span>
            <span className={styles.value}>{currentBlock.kind}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Status:</span>
            <span className={styles.value}>{currentBlock.status}</span>
          </div>
        </div>
      )}
    </Panel>
  );
}
