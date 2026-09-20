import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { Button } from '@cctv/core/Button/Button';
import { useSubmitNewsletterResponse } from '@cctv/hooks/useSubmitNewsletterResponse';
import { NewsletterSignupPayload } from '@cctv/types';

import styles from './NewsletterSignup.module.scss';

const DEFAULT_PROMPT = 'Can we add you to our mailing list?';
const DEFAULT_CONFIRMATION = "Thanks — you're on the list!";
const DEFAULT_DECLINE = 'No problem — maybe next time.';

interface NewsletterSignupProps extends NewsletterSignupPayload {
  blockId?: string;
  disabled?: boolean;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function NewsletterSignup({
  prompt,
  confirmationMessage,
  declineMessage,
  blockId,
  disabled = false,
  viewContext = 'participant',
}: NewsletterSignupProps) {
  const { submitNewsletterResponse, isLoading, error } = useSubmitNewsletterResponse();
  const { submissionState } = useExperienceState();
  const submission = blockId ? submissionState[blockId] : undefined;
  const hasResponded = !!submission;

  const promptText = prompt || DEFAULT_PROMPT;

  const handleSubmit = async (subscribed: boolean) => {
    if (!blockId || isLoading || hasResponded) return;
    await submitNewsletterResponse(blockId, subscribed);
  };

  if (hasResponded) {
    const subscribed = submission?.answer?.subscribed === true;
    return (
      <div className={styles.submitted}>
        <p className={styles.prompt}>{promptText}</p>
        <p className={styles.value}>
          {subscribed
            ? confirmationMessage || DEFAULT_CONFIRMATION
            : declineMessage || DEFAULT_DECLINE}
        </p>
      </div>
    );
  }

  if (viewContext === 'monitor') {
    return (
      <div className={styles.submitted}>
        <p className={styles.prompt}>{promptText}</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <p className={styles.prompt}>{promptText}</p>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <Button onClick={() => handleSubmit(true)} disabled={disabled || isLoading}>
          Yes, sign me up
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit(false)}
          disabled={disabled || isLoading}
        >
          No thanks
        </Button>
      </div>
    </div>
  );
}
