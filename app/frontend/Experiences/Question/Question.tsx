import { FormEvent, useState } from 'react';

import { Button, TextInput } from '@cctv/core';
import { useSubmitQuestionResponse } from '@cctv/hooks/useSubmitQuestionResponse';
import { QuestionPayload } from '@cctv/types';
import { getFormData } from '@cctv/utils';

import styles from './Question.module.scss';

interface QuestionProps extends QuestionPayload {
  blockId?: string;
  responses?: {
    total: number;
    user_responded: boolean;
  };
  buttonText?: string;
}

export default function Question({
  question,
  formKey,
  inputType = 'text',
  blockId,
  responses,
  buttonText = 'Submit',
}: QuestionProps) {
  const [submittedValue, setSubmittedValue] = useState<string>('');
  const { submitQuestionResponse, isLoading, error } = useSubmitQuestionResponse();
  const userAlreadyResponded = responses?.user_responded || false;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<Record<string, string>>(e.currentTarget);
    const value = formData[formKey] || '';

    // Get the block ID from props or URL query params
    const actualBlockId = blockId || new URLSearchParams(window.location.search).get('blockId');

    if (!actualBlockId) {
      console.error('No block ID found');
      return;
    }

    const response = await submitQuestionResponse({
      blockId: actualBlockId,
      answer: {
        text: value,
        submittedAt: new Date().toISOString(),
      },
    });

    if (response?.success) {
      setSubmittedValue(value);
    }
  };

  if (submittedValue || userAlreadyResponded) {
    return (
      <div className={styles.submittedValue}>
        <p className={styles.legend}>{question}</p>
        {submittedValue ? (
          <p className={styles.value}>{submittedValue}</p>
        ) : (
          <p className={styles.value}>You have already responded to this question.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{question}</legend>
        {error && <p className={styles.error}>{error}</p>}
        <TextInput name={formKey} type={inputType} required />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : buttonText}
        </Button>
      </fieldset>
    </form>
  );
}
