import { Button } from '@cctv/core';
import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';

import styles from './ProgramTab.module.scss';

interface ProgramTabProps {
  blocks: Block[];
  participants: ParticipantSummary[];
  onBlockStatusChange: (block: Block, status: BlockStatus) => void;
  busyBlockId?: string;
  onCreateBlock: () => void;
}

export default function ProgramTab({
  blocks,
  participants,
  onBlockStatusChange,
  busyBlockId,
  onCreateBlock,
}: ProgramTabProps) {
  const getKindColor = (kind: string) => {
    const colors: Record<string, { bg: string; shadow: string }> = {
      poll: { bg: '#ff00f5', shadow: '#00ffff' },
      question: { bg: '#3300ff', shadow: '#ffff00' },
      multistep_form: { bg: '#2fff2f', shadow: '#ff00f5' },
      announcement: { bg: '#ff4911', shadow: '#00ff00' },
      mad_lib: { bg: '#ffff00', shadow: '#ff00f5' },
    };
    return colors[kind] || { bg: '#ffffff', shadow: '#000000' };
  };

  const getStatusAction = (block: Block) => {
    if (block.status === 'open') {
      return { label: 'Close', action: 'closed' as BlockStatus };
    }
    if (block.status === 'closed') {
      return { label: 'Make Live', action: 'open' as BlockStatus };
    }
    return { label: 'Make Live', action: 'open' as BlockStatus };
  };

  return (
    <div className={styles.root}>
      {blocks.length === 0 ? (
        <div className={styles.emptyState}>No programming scheduled</div>
      ) : (
        <>
          {blocks.map((block) => {
            const statusAction = getStatusAction(block);
            const kindColor = getKindColor(block.kind);
            const isBusy = busyBlockId === block.id;

            return (
              <div key={block.id} className={styles.row}>
                <div className={styles.kindLogo} style={{ backgroundColor: kindColor.bg }}>
                  <div
                    className={styles.kindPill}
                    style={{ boxShadow: `4px 4px 0 ${kindColor.shadow}` }}
                  >
                    {block.kind.toUpperCase().replace('_', ' ')}
                  </div>
                </div>

                <div className={styles.info}>
                  <div className={styles.status}>
                    Status: <span className={styles.statusValue}>{block.status}</span>
                  </div>
                  <Button
                    onClick={() => onBlockStatusChange(block, statusAction.action)}
                    disabled={isBusy}
                    className={styles.actionButton}
                  >
                    {isBusy ? 'Processing...' : statusAction.label}
                  </Button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
