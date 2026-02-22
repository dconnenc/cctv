import { FormEvent, useState } from 'react';

import { Button } from '@cctv/core/Button/Button';
import { Option } from '@cctv/core/Option/Option';
import { useSubmitPollResponse } from '@cctv/hooks/useSubmitPollResponse';
import { PollPayload } from '@cctv/types';
import { getFormData } from '@cctv/utils';

import styles from './Poll.module.scss';

interface PollProps extends PollPayload {
  blockId?: string;
  responses?: {
    total: number;
    user_responded: boolean;
    user_response?: {
      id: string;
      answer: any;
    } | null;
    aggregate?: Record<string, number>;
  };
  disabled?: boolean;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function Poll({
  question,
  options,
  pollType,
  blockId,
  responses,
  disabled = false,
  viewContext = 'participant',
}: PollProps) {
  const [submittedValue, setSubmittedValue] = useState<string[]>([]);
  const { submitPollResponse, isLoading, error } = useSubmitPollResponse();
  const userAlreadyResponded = responses?.user_responded || false;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<{ selectedOptions: string[] }>(e.currentTarget);
    const selectedOptions = formData.selectedOptions;

    // Get the block ID from props or URL query params
    const actualBlockId = blockId || new URLSearchParams(window.location.search).get('blockId');

    if (!actualBlockId) {
      console.error('No block ID found');
      return;
    }

    if (!selectedOptions) {
      console.error('No selected options found');
      return;
    }

    const response = await submitPollResponse({
      blockId: actualBlockId,
      answer: {
        selectedOptions: selectedOptions,
        submittedAt: new Date().toISOString(),
      },
    });

    if (response?.success) {
      setSubmittedValue(selectedOptions);
    }
  };

  if (submittedValue.length > 0 || userAlreadyResponded) {
    const displayValue =
      submittedValue.length > 0
        ? submittedValue.join(', ')
        : responses?.user_response?.answer?.selectedOptions?.join(', ') ||
          'You have already responded to this poll.';

    return (
      <div className={styles.submittedValue}>
        <p className={styles.legend}>{question}</p>
        <p className={styles.value}>{displayValue}</p>
      </div>
    );
  }

  if (viewContext === 'monitor') {
    return (
      <div className={styles.submittedValue}>
        <p className={styles.legend}>{question}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <fieldset disabled={disabled} className={styles.fieldset}>
        <legend className={styles.legend}>{question}</legend>
        {error && <p className={styles.error}>{error}</p>}
        {options.map((option) => (
          <Option
            allowMultiple={pollType === 'multiple'}
            key={option}
            option={option}
            name="selectedOptions"
            disabled={disabled}
          />
        ))}
        <Button type="submit" loading={isLoading} loadingText="Submitting...">
          Submit
        </Button>
      </fieldset>
    </form>
  );
}
