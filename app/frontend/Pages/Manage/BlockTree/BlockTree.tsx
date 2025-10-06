import { Block, ParticipantSummary } from '@cctv/types';

import styles from './BlockTree.module.scss';

interface BlockTreeProps {
  blocks: Block[];
  participants: ParticipantSummary[];
}

export function BlockTree({ blocks, participants }: BlockTreeProps) {
  const blockMap = new Map(blocks.map((b) => [b.id, b]));

  const parentBlocks = blocks.filter(
    (block) => !block.parent_block_ids || block.parent_block_ids.length === 0,
  );

  const renderBlock = (block: Block, depth: number = 0): JSX.Element => {
    const hasChildren = block.child_block_ids && block.child_block_ids.length > 0;
    const indentStyle = { paddingLeft: `${depth * 24}px` };

    const targetInfo = getTargetInfo(block);

    return (
      <div key={block.id} className={styles.blockNode}>
        <div className={styles.blockRow} style={indentStyle}>
          <div className={styles.blockIcon}>{hasChildren ? '📦' : '📄'}</div>
          <div className={styles.blockInfo}>
            <span className={styles.blockKind}>{block.kind}</span>
            <span className={styles.blockId}>#{block.id.slice(0, 8)}</span>
            <span className={styles.blockStatus}>{block.status}</span>
            {targetInfo && <span className={styles.blockTarget}>{targetInfo}</span>}
          </div>
        </div>
        {hasChildren &&
          block.child_block_ids!.map((childId) => {
            const child = blockMap.get(childId);
            return child ? renderBlock(child, depth + 1) : null;
          })}
      </div>
    );
  };

  const getTargetInfo = (block: Block): string | null => {
    if (block.target_user_ids && block.target_user_ids.length > 0) {
      const targetParticipants = participants.filter((p) =>
        block.target_user_ids!.includes(p.user_id),
      );
      if (targetParticipants.length > 0) {
        return `→ ${targetParticipants.map((p) => p.name).join(', ')}`;
      }
    }
    return null;
  };

  return (
    <div className={styles.blockTree}>
      {parentBlocks.length === 0 ? (
        <div className={styles.emptyState}>No blocks with hierarchy</div>
      ) : (
        parentBlocks.map((block) => renderBlock(block))
      )}
    </div>
  );
}
