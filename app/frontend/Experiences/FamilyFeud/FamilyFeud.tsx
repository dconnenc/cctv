import { useEffect, useState } from 'react';

import { SoundKey, useLoopingMonitorSound, useMonitorSound } from '@cctv/sounds';
import { FamilyFeudPayload } from '@cctv/types';

import BucketCard from './BucketCard';
import XAnimation from './XAnimation';

import styles from './FamilyFeud.module.scss';

interface FamilyFeudProps extends FamilyFeudPayload {
  contained?: boolean;
  sounds?: Partial<Record<string, SoundKey>>;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function FamilyFeud({
  title,
  game_state,
  theme_music_playing,
  theme_music_restart_count,
  contained,
  sounds,
  viewContext,
}: FamilyFeudProps) {
  useMonitorSound(sounds?.on_show_x, game_state?.show_x ?? false, viewContext);
  useLoopingMonitorSound(
    sounds?.theme,
    theme_music_playing ?? false,
    viewContext,
    theme_music_restart_count,
  );

  const currentQuestionIndex = game_state?.current_question_index ?? 0;
  const [expandedBucketId, setExpandedBucketId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedBucketId(null);
  }, [currentQuestionIndex]);

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

  const allRevealed =
    currentQuestion.buckets.length > 0 &&
    currentQuestion.buckets.every((bucket) => bucket.revealed);
  const expandable = viewContext === 'participant' && allRevealed;

  return (
    <div className={styles.playingRoot}>
      <h2 className={styles.questionTitle}>{currentQuestion.question_text}</h2>
      <div className={styles.bucketsGrid}>
        {currentQuestion.buckets.map((bucket, index) => (
          <BucketCard
            key={bucket.bucket_id}
            bucket={bucket}
            index={index}
            expandable={expandable}
            expanded={expandable && expandedBucketId === bucket.bucket_id}
            onToggle={
              expandable
                ? () =>
                    setExpandedBucketId((current) =>
                      current === bucket.bucket_id ? null : bucket.bucket_id,
                    )
                : undefined
            }
          />
        ))}
      </div>
      <XAnimation show={game_state.show_x} contained={contained} />
    </div>
  );
}
