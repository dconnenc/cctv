import { Bug } from 'lucide-react';

import styles from './FeedbackTrigger.module.scss';

export interface FeedbackTriggerProps {
  onClick: () => void;
}

/**
 * Anchored above the safe-area inset so it clears the iOS home indicator and the
 * bottom nav on phones, where most of the audience is.
 */
export function FeedbackTrigger({ onClick }: FeedbackTriggerProps) {
  return (
    <button type="button" className={styles.trigger} onClick={onClick} aria-label="Give feedback">
      <Bug className={styles.icon} aria-hidden="true" />
    </button>
  );
}
