import { ArrowLeft } from 'lucide-react';

import { Button } from '@cctv/core';
import { BLOCK_KIND_LABELS, Block, ParticipantSummary } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';
import BlockResponsesList from '../Viewer/BlockResponsesList';

import styles from './FocusReview.module.scss';

interface FocusReviewProps {
  block: Block;
  participants: ParticipantSummary[];
  onBack: () => void;
}

export default function FocusReview({ block, participants, onBack }: FocusReviewProps) {
  const responseCount = block.responses?.total ?? 0;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={onBack} title="Back to history">
          <ArrowLeft size={18} />
          <span>Back</span>
        </Button>
        <h1 className={styles.title}>{BLOCK_KIND_LABELS[block.kind]}</h1>
        <span className={styles.done}>Finished</span>
      </div>

      <div className={styles.columns}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>What the audience saw</span>
          </div>
          <div className={styles.panelBody}>
            <BlockPreview block={block} viewContext="monitor" />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Responses</span>
            <span className={styles.count}>
              {responseCount} {responseCount === 1 ? 'response' : 'responses'}
            </span>
          </div>
          <div className={styles.panelBody}>
            <BlockResponsesList block={block} participants={participants} />
          </div>
        </div>
      </div>
    </div>
  );
}
