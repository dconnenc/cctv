import { useParams } from 'react-router-dom';

import { DialogDescription, DialogTitle } from '@cctv/components/ui/dialog';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { BlockKind, type Block as BlockType } from '@cctv/types';

import FamilyFeudManager from './FamilyFeudManager/FamilyFeudManager';

import styles from './Block.module.scss';

interface BlockProps {
  blockId: string;
}

export default function Block({ blockId }: BlockProps) {
  const { experience, isLoading } = useExperience();

  if (isLoading) {
    return (
      <div className="flex-centered">
        <p>Loading block...</p>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex-centered">
        <p>Experience not found</p>
      </div>
    );
  }

  // Find block in top level or nested children
  let block = experience.blocks.find((b) => b.id === blockId);

  if (!block) {
    for (const parentBlock of experience.blocks) {
      if (parentBlock.children?.length) {
        block = parentBlock.children.find((child: BlockType) => child.id === blockId);
        if (block) break;
      }
    }
  }

  if (!block) {
    return (
      <div className="flex-centered">
        <h1>Block not found</h1>
        <p>The block you're looking for doesn't exist.</p>
      </div>
    );
  }

  // Render family feud manager for family_feud blocks
  if (block.kind === BlockKind.FAMILY_FEUD) {
    return <FamilyFeudManager block={block} />;
  }

  // Default view for other block types
  return (
    <div className={styles.root}>
      <DialogTitle className={styles.title}>Block Details</DialogTitle>
      <DialogDescription className="sr-only">View block information</DialogDescription>
      <div className={styles.content}>
        <div className={styles.field}>
          <span className={styles.label}>Kind:</span>
          <span className={styles.value}>{block.kind}</span>
        </div>
      </div>
    </div>
  );
}

export function BlockPage() {
  const { blockId } = useParams<{ blockId: string }>();

  if (!blockId) {
    return (
      <div className="flex-centered">
        <p>Block ID not found</p>
      </div>
    );
  }
  return (
    <div className={styles.root}>
      <Block blockId={blockId} />
    </div>
  );
}
