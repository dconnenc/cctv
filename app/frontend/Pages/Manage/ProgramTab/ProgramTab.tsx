import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';

import { BlocksTable } from '../BlocksTable/BlocksTable';

import styles from './ProgramTab.module.scss';

interface ProgramTabProps {
  blocks: Block[];
  participants: ParticipantSummary[];
  onBlockStatusChange: (block: Block, status: BlockStatus) => void;
  busyBlockId?: string;
  onBlockClick?: (blockId: string) => void;
}

export default function ProgramTab({
  blocks,
  participants,
  onBlockStatusChange,
  busyBlockId,
  onBlockClick,
}: ProgramTabProps) {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <BlocksTable
          blocks={blocks}
          onChange={onBlockStatusChange}
          busyId={busyBlockId}
          participants={participants}
          onBlockClick={onBlockClick}
        />
      </div>
    </div>
  );
}
