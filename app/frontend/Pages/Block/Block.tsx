import { useParams } from 'react-router-dom';

import { useExperience } from '@cctv/contexts';

import styles from './Block.module.scss';

export default function Block() {
  const { blockId } = useParams<{ blockId: string }>();
  const { experience, isLoading } = useExperience();

  console.log(experience);
  console.log(isLoading);

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
