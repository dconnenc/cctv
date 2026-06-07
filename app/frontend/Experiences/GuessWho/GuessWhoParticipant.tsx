import { useState } from 'react';

import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { Button } from '@cctv/core/Button/Button';
import { useSubmitPollResponse } from '@cctv/hooks/useSubmitPollResponse';
import { GuessWhoBlock } from '@cctv/types';

import styles from './GuessWho.module.scss';

interface GuessWhoParticipantProps {
  block: GuessWhoBlock;
}

export default function GuessWhoParticipant({ block }: GuessWhoParticipantProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitPollResponse, error } = useSubmitPollResponse();
  const { submissionState } = useExperienceState();
  const activePoll = block.payload.active_poll;

  if (!activePoll) {
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Guess Who?</h2>
        <p className={styles.empty}>Watch the monitor — a poll will appear here when it's time.</p>
      </div>
    );
  }

  const submission = submissionState[activePoll.id];
  const userResponded = !!submission || !!activePoll.user_responded;

  if (userResponded) {
    const selected =
      (submission?.answer?.selectedOptions as string[] | undefined) ??
      activePoll.user_response?.answer?.selectedOptions;
    const answer = selected?.join(', ') ?? '';
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Guess Who?</h2>
        <p className={styles.legend}>You answered:</p>
        <p className={styles.answerText}>{answer}</p>
      </div>
    );
  }

  const handleSelect = async (option: string) => {
    setIsSubmitting(true);
    const response = await submitPollResponse({
      blockId: activePoll.id,
      answer: {
        selectedOptions: [option],
        submittedAt: new Date().toISOString(),
      },
    });
    if (!response?.success) setIsSubmitting(false);
  };

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>True or False?</h2>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.fieldset}>
        {activePoll.options.map((option) => (
          <Button key={option} disabled={isSubmitting} onClick={() => handleSelect(option)}>
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
