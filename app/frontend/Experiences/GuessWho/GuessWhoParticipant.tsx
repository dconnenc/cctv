import { useEffect, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { Button } from '@cctv/core/Button/Button';
import { useSubmitPollResponse } from '@cctv/hooks/useSubmitPollResponse';
import { GuessWhoBlock } from '@cctv/types';

import styles from './GuessWho.module.scss';

interface GuessWhoParticipantProps {
  block: GuessWhoBlock;
}

const WATCH_MONITOR = (
  <div className={styles.root}>
    <h2 className={styles.title}>Guess Who?</h2>
    <p className={styles.empty}>Watch the monitor — a poll will appear here when it's time.</p>
  </div>
);

export default function GuessWhoParticipant({ block }: GuessWhoParticipantProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitPollResponse, error } = useSubmitPollResponse();
  const { submissionState } = useExperienceState();
  const { participant } = useExperience();
  const activePoll = block.payload.active_poll;

  useEffect(() => {
    setIsSubmitting(false);
  }, [activePoll?.id]);

  const myUserId = participant?.user_id;
  const isEliminated =
    !!myUserId && block.payload.contestants.some((c) => c.eliminated_user_ids.includes(myUserId));

  if (!activePoll || isEliminated) {
    return WATCH_MONITOR;
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
