import { Panel } from '@cctv/core';
import { Block, Experience, ParticipantSummary } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';
import QRCodeDisplay from '../QRCodeDisplay/QRCodeDisplay';

import styles from './ContextView.module.scss';

interface ContextViewProps {
  block?: Block;
  participant?: ParticipantSummary;
  emptyMessage: string;
  monitorView?: Experience;
  viewMode: 'monitor' | 'participant';
  title?: string;
}

export default function ContextView({
  block,
  participant,
  emptyMessage,
  monitorView,
  viewMode,
  title,
}: ContextViewProps) {
  const panelTitle = title || (viewMode === 'monitor' ? 'Monitor View' : 'Current');
  if (viewMode === 'monitor' && monitorView) {
    const monitorBlock = monitorView.blocks[0];

    return (
      <Panel title={panelTitle}>
        <div className={styles.preview}>
          {monitorBlock ? (
            <BlockPreview block={monitorBlock} />
          ) : (
            <QRCodeDisplay experience={monitorView} />
          )}
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
