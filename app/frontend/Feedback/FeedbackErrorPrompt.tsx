import { TriangleAlert, X } from 'lucide-react';

import { Button } from '@cctv/core';

import styles from './FeedbackErrorPrompt.module.scss';

export interface FeedbackErrorPromptProps {
  message: string;
  onDescribe: () => void;
  onDismiss: () => void;
}

/**
 * Non-blocking by design: the error is already recorded, so dismissing this
 * costs nothing but the user's account of what they were doing.
 */
export function FeedbackErrorPrompt({ message, onDescribe, onDismiss }: FeedbackErrorPromptProps) {
  return (
    <output className={styles.prompt}>
      <TriangleAlert className={styles.icon} aria-hidden="true" />

      <div className={styles.body}>
        <p className={styles.title}>Something went wrong</p>
        <p className={styles.message}>{message}</p>
      </div>

      <div className={styles.actions}>
        <Button type="button" size="sm" onClick={onDescribe}>
          Tell us more
        </Button>
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </output>
  );
}
