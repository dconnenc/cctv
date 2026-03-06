import { Panel } from '@cctv/core/Panel/Panel';
import { Block, Experience, ParticipantSummary } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';

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
            <BlockPreview block={monitorBlock} viewContext="monitor" />
          ) : (
            <div className={styles.emptyState}>{emptyMessage}</div>
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
