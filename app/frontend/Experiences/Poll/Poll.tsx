import { FormEvent, useState } from 'react';

import { Button, Option } from '@cctv/core';
import { UserWithRole, PollExperience } from '@cctv/types';
import { getFormData } from '@cctv/utils';
import { useSubmitPollResponse } from '@cctv/hooks/useSubmitPollResponse';

import styles from './Poll.module.scss';

interface PollProps extends PollExperience {
  user: UserWithRole;
  blockId?: string;
  responses?: {
    total: number;
    user_responded: boolean;
    aggregate?: Record<string, number>;
  };
}

export default function Poll({ user, question, options, pollType, blockId, responses }: PollProps) {
  const [submittedValue, setSubmittedValue] = useState<string[]>([]);
  const { submitPollResponse, isLoading, error } = useSubmitPollResponse();
  const userAlreadyResponded = responses?.user_responded || false;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<{ selectedOptions: string[] }>(e.currentTarget);
    const selectedOptions = formData.selectedOptions;

    const value = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions ?? ''];
    
    // Get the block ID from props or URL query params
    const actualBlockId = blockId || new URLSearchParams(window.location.search).get('blockId');
    
    if (!actualBlockId) {
      console.error('No block ID found');
      return;
    }

    const response = await submitPollResponse({
      blockId: actualBlockId,
      answer: {
        selectedOptions: value,
        submittedAt: new Date().toISOString()
      }
    });

    if (response?.success) {
      setSubmittedValue(value);
    }
  };

  if (submittedValue.length > 0 || userAlreadyResponded) {
    return (
      <div className={styles.submittedValue}>
        <p className={styles.legend}>{question}</p>
        {submittedValue.length > 0 ? (
          <p className={styles.value}>{submittedValue.join(', ')}</p>
        ) : (
          <p className={styles.value}>You have already responded to this poll.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{question}</legend>
        {error && <p className={styles.error}>{error}</p>}
        {options.map((option) => (
          <Option
            allowMultiple={pollType === 'multiple'}
            key={option}
            option={option}
            name="selectedOptions"
          />
        ))}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>
      </fieldset>
    </form>
  );
}
