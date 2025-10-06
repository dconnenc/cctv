import { Plus } from 'lucide-react';

import { Button } from '@cctv/core';
import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';

import { BlocksTable } from '../BlocksTable/BlocksTable';

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
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h4 className={styles.title}>Program Blocks</h4>
        <Button onClick={onCreateBlock}>
          <Plus size={16} />
          <span>Block</span>
        </Button>
      </div>

      <div className={styles.content}>
        <BlocksTable
          blocks={blocks}
          onChange={onBlockStatusChange}
          busyId={busyBlockId}
          participants={participants}
        />
      </div>
    </div>
  );
}
