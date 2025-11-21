import { useParams } from 'react-router-dom';

import { useExperience } from '@cctv/contexts';
import { BlockKind } from '@cctv/types';

import FamilyFeudManager from './FamilyFeudManager/FamilyFeudManager';

import styles from './Block.module.scss';

export default function Block() {
  const { blockId } = useParams<{ blockId: string }>();
  const { experience, isLoading } = useExperience();

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <p>Loading block...</p>
      </section>
    );
  }

  if (!experience) {
    return (
      <section className="page flex-centered">
        <p>Experience not found</p>
      </section>
    );
  }

  const block = experience.blocks.find((b) => b.id === blockId);

  if (!block) {
    return (
      <section className="page flex-centered">
        <h1>Block not found</h1>
        <p>The block you're looking for doesn't exist.</p>
      </section>
    );
  }

  // Render family feud manager for family_feud blocks
  if (block.kind === BlockKind.FAMILY_FEUD) {
    return (
      <section className="page">
        <FamilyFeudManager block={block} />
      </section>
    );
  }

  // Default view for other block types
  return (
    <section className="page">
      <div className={styles.root}>
        <h1 className={styles.title}>Block Details</h1>
        <div className={styles.content}>
          <div className={styles.field}>
            <span className={styles.label}>Kind:</span>
            <span className={styles.value}>{block.kind}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
