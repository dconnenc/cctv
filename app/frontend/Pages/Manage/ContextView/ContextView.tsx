import { Panel } from '@cctv/core';
import { Block, ParticipantSummary } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';

import styles from './ContextView.module.scss';

interface ContextViewProps {
  block?: Block;
  participant?: ParticipantSummary;
  emptyMessage: string;
}

export default function ContextView({ block, participant, emptyMessage }: ContextViewProps) {
  return (
    <Panel title="Current">
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
