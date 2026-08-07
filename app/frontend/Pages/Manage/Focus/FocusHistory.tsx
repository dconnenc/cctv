import { BLOCK_KIND_LABELS, Block } from '@cctv/types';

import { blockSummary } from './ActivityTile';
import KindPreview from './KindPreview';

import styles from './FocusHistory.module.scss';

interface FocusHistoryProps {
  blocks: Block[];
  onSelect: (block: Block) => void;
}

export default function FocusHistory({ blocks, onSelect }: FocusHistoryProps) {
  if (blocks.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nothing has run yet.</p>
        <p>Activities show up here once you finish them.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {blocks.map((block) => {
        const count = block.responses?.total ?? 0;
        return (
          <button
            key={block.id}
            type="button"
            className={styles.row}
            onClick={() => onSelect(block)}
          >
            <KindPreview kind={block.kind} className={styles.thumb} />
            <span className={styles.text}>
              <span className={styles.summary}>
                {blockSummary(block) || BLOCK_KIND_LABELS[block.kind]}
              </span>
              <span className={styles.kind}>{BLOCK_KIND_LABELS[block.kind]}</span>
            </span>
            <span className={styles.count}>
              {count} {count === 1 ? 'response' : 'responses'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
