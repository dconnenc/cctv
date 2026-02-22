import { FamilyFeudPayload } from '@cctv/types';

import BucketCard from './BucketCard';
import XAnimation from './XAnimation';

import styles from './FamilyFeud.module.scss';

interface FamilyFeudProps extends FamilyFeudPayload {}

export default function FamilyFeud({ title, game_state }: FamilyFeudProps) {
  if (!game_state || game_state.phase === 'gathering') {
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>{title}</h2>
      </div>
    );
  }

  const currentQuestion = game_state.questions[game_state.current_question_index];

  if (!currentQuestion) {
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.error}>No question available</p>
      </div>
    );
  }

  return (
    <div className={styles.playingRoot}>
      <h2 className={styles.questionTitle}>{currentQuestion.question_text}</h2>
      <div className={styles.bucketsGrid}>
        {currentQuestion.buckets.map((bucket, index) => (
          <BucketCard key={bucket.bucket_id} bucket={bucket} index={index} />
        ))}
      </div>
      <XAnimation show={game_state.show_x} />
    </div>
  );
}
