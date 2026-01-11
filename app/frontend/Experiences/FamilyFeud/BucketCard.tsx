import { FamilyFeudBucket } from '@cctv/types';

import styles from './BucketCard.module.scss';

interface BucketCardProps {
  bucket: FamilyFeudBucket;
  index: number;
}

export default function BucketCard({ bucket, index }: BucketCardProps) {
  if (!bucket.revealed) {
    return (
      <div className={styles.card}>
        <div className={styles.hiddenContent}>
          <span className={styles.questionMark}>?</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.revealed}`}>
      <div className={styles.revealedContent}>
        <div className={styles.textContent}>
          <span className={styles.percentage}>{bucket.percentage}%</span>
          <span className={styles.bucketName}>{bucket.bucket_name}</span>
        </div>
      </div>
    </div>
  );
}
