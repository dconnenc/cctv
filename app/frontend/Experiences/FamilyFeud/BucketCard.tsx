import { ChevronDown } from 'lucide-react';

import { FamilyFeudBucket } from '@cctv/types';

import styles from './BucketCard.module.scss';

interface BucketCardProps {
  bucket: FamilyFeudBucket;
  index: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export default function BucketCard({ bucket, expandable, expanded, onToggle }: BucketCardProps) {
  if (!bucket.revealed) {
    return (
      <div className={styles.card}>
        <div className={styles.hiddenContent}>
          <span className={styles.questionMark}>?</span>
        </div>
      </div>
    );
  }

  if (expandable) {
    const answers = bucket.answers ?? [];

    return (
      <div className={`${styles.card} ${styles.revealed} ${styles.expandable}`}>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `Hide answers for ${bucket.bucket_name}`
              : `Show answers for ${bucket.bucket_name}`
          }
        >
          <div className={styles.textContent}>
            <span className={styles.percentage}>{bucket.percentage}%</span>
            <span className={styles.bucketName}>{bucket.bucket_name}</span>
          </div>
          <ChevronDown
            size={20}
            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
          />
        </button>
        {expanded && (
          <ul className={styles.answers}>
            {answers.length === 0 ? (
              <li className={styles.answerEmpty}>No answers</li>
            ) : (
              answers.map((answer) => (
                <li key={answer.id} className={styles.answer}>
                  {answer.text}
                </li>
              ))
            )}
          </ul>
        )}
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
