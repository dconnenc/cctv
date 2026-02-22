import { Button } from '@cctv/core/Button/Button';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { Panel } from '@cctv/core/Panel/Panel';
import { Experience, ParticipantSummary } from '@cctv/types';

import styles from './ContextDetails.module.scss';

type ViewMode = 'monitor' | 'participant';

interface ContextDetailsProps {
  monitorView?: Experience;
  participantView?: Experience;
  participants: ParticipantSummary[];
  selectedParticipantId?: string;
  setSelectedParticipantId: (id: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export default function ContextDetails({
  monitorView,
  participantView,
  participants,
  selectedParticipantId,
  setSelectedParticipantId,
  viewMode,
  setViewMode,
}: ContextDetailsProps) {
  const currentBlock =
    viewMode === 'monitor'
      ? monitorView?.blocks.find((block) => block.status === 'open')
      : participantView?.blocks[0];

  return (
    <Panel title="Details">
      <div className={styles.toggleButtons}>
        <Button onClick={() => setViewMode('monitor')} disabled={viewMode === 'monitor'}>
          Monitor View
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
