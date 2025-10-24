import { Panel } from '@cctv/core';
import { Block, Experience, ParticipantSummary } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';
import QRCodeDisplay from '../QRCodeDisplay/QRCodeDisplay';

import styles from './ContextView.module.scss';

interface ContextViewProps {
  block?: Block;
  participant?: ParticipantSummary;
  emptyMessage: string;
  tvView?: Experience;
  viewMode: 'tv' | 'participant';
  title?: string;
}

export default function ContextView({
  block,
  participant,
  emptyMessage,
  tvView,
  viewMode,
  title,
}: ContextViewProps) {
  const panelTitle = title || (viewMode === 'tv' ? 'TV View' : 'Current');
  if (viewMode === 'tv' && tvView) {
    const tvBlock = tvView.blocks[0];

    return (
      <Panel title={panelTitle}>
        <div className={styles.preview}>
          {tvBlock ? <BlockPreview block={tvBlock} /> : <QRCodeDisplay experience={tvView} />}
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={panelTitle}>
      <div className={styles.preview}>
        {block ? (
          <BlockPreview block={block} participant={participant} />
        ) : (
          <div className={styles.emptyState}>{emptyMessage}</div>
        )}
      </div>
    </Panel>
  );
}
