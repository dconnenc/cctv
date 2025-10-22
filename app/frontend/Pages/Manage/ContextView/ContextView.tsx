import { useMemo } from 'react';

import { Experience, ParticipantSummary } from '@cctv/types';

import offlineTvUrl from '../../../images/offline-tv-vectors.svg';
import BlockPreview from '../BlockPreview/BlockPreview';
import { ViewSelector } from './ViewSelector';

import styles from './ContextView.module.scss';

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
  const viewMode = selectedParticipantId === 'tv' ? 'tv' : 'participant';

  const currentBlock = useMemo(() => {
    return viewMode === 'tv'
      ? tvView?.blocks.find((block) => block.status === 'open')
      : participantView?.blocks[0];
  }, [viewMode, tvView, participantView]);

  const participant = participants.find((p) => p.id === selectedParticipantId);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <ViewSelector
          participants={participants}
          value={selectedParticipantId}
          onChange={setSelectedParticipantId}
        />

        <div className={styles.status}>
          {isConnected ? (
            <span className={styles.connected}>🟢 Live</span>
          ) : (
            <span className={styles.disconnected}>🔴 Not connected</span>
          )}
        </div>
      </div>

      <div className={styles.preview}>
        {currentBlock ? (
          <BlockPreview
            block={currentBlock}
            participant={viewMode === 'participant' ? participant : undefined}
          />
        ) : (
          <div className={styles.emptyState}>
            <img src={offlineTvUrl} alt="Offline TV" className={styles.offlineTv} />
            <div className={styles.emptyMessage}>No scheduled programming</div>
          </div>
        )}
      </div>
    </div>
  );
}
