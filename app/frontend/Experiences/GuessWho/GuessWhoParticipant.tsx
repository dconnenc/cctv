import { FormEvent, useState } from 'react';

import { Button } from '@cctv/core/Button/Button';
import { Option } from '@cctv/core/Option/Option';
import { useSubmitPollResponse } from '@cctv/hooks/useSubmitPollResponse';
import { GuessWhoBlock } from '@cctv/types';
import { getFormData } from '@cctv/utils';

import styles from './GuessWho.module.scss';

interface GuessWhoParticipantProps {
  block: GuessWhoBlock;
}

export default function GuessWhoParticipant({ block }: GuessWhoParticipantProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitPollResponse, error } = useSubmitPollResponse();
  const activePoll = block.payload.active_poll;

  if (!activePoll) {
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Guess Who?</h2>
        <p className={styles.empty}>Watch the monitor — a poll will appear here when it's time.</p>
      </div>
    );
  }

  if (activePoll.user_responded) {
    const answer = activePoll.user_response?.answer?.selectedOptions?.join(', ') ?? '';
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Guess Who?</h2>
        <p className={styles.legend}>You answered:</p>
        <p className={styles.answerText}>{answer}</p>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<{ selectedOptions: string[] }>(e.currentTarget);
    if (!formData.selectedOptions) return;

    setIsSubmitting(true);
    const response = await submitPollResponse({
      blockId: activePoll.id,
      answer: {
        selectedOptions: formData.selectedOptions,
        submittedAt: new Date().toISOString(),
      },
    });
    if (!response?.success) setIsSubmitting(false);
  };

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>True or False?</h2>
      <form onSubmit={onSubmit}>
        <fieldset disabled={isSubmitting} className={styles.fieldset}>
          {error && <p className={styles.error}>{error}</p>}
          {activePoll.options.map((option) => (
            <Option
              allowMultiple={false}
              key={option}
              option={option}
              name="selectedOptions"
              disabled={isSubmitting}
            />
          ))}
          <Button type="submit">Submit</Button>
        </fieldset>
      </form>
    </div>
  );
}
