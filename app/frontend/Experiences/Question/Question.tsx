import { FormEvent, useEffect, useState } from 'react';

import { Button } from '@cctv/core/Button/Button';
import { TextInput } from '@cctv/core/TextInput/TextInput';
import { useSubmitQuestionResponse } from '@cctv/hooks/useSubmitQuestionResponse';
import { QuestionPayload } from '@cctv/types';
import { getFormData } from '@cctv/utils';

import styles from './Question.module.scss';

interface QuestionProps extends QuestionPayload {
  blockId?: string;
  responses?: {
    total: number;
    user_responded: boolean;
    user_response?: {
      id: string;
      answer: any;
    } | null;
  };
  buttonText?: string;
  disabled?: boolean;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function Question({
  question,
  formKey,
  inputType = 'text',
  blockId,
  responses,
  buttonText = 'Submit',
  disabled = false,
  viewContext = 'participant',
}: QuestionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitQuestionResponse, error } = useSubmitQuestionResponse();

  useEffect(() => {
    setIsSubmitting(false);
  }, [blockId]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<Record<string, string>>(e.currentTarget);
    const value = formData[formKey] || '';

    const actualBlockId = blockId || new URLSearchParams(window.location.search).get('blockId');

    if (!actualBlockId) {
      console.error('No block ID found');
      return;
    }

    setIsSubmitting(true);

    const response = await submitQuestionResponse({
      blockId: actualBlockId,
      answer: {
        value: value,
        submittedAt: new Date().toISOString(),
      },
    });

    if (!response?.success) {
      setIsSubmitting(false);
    }
  };

  if (responses?.user_responded) {
    const displayValue =
      responses?.user_response?.answer?.value || 'You have already responded to this question.';

    return (
      <div className={styles.submittedValue}>
        <p className={styles.legend}>{question}</p>
        <p className={styles.value}>{displayValue}</p>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className={styles.submittedValue}>
        <p className={styles.legend}>{question}</p>
        <p className={styles.value}>Submitting...</p>
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
    <form className={styles.form} onSubmit={onSubmit}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{question}</legend>
        {error && <p className={styles.error}>{error}</p>}
        <TextInput key={blockId} name={formKey} type={inputType} required disabled={disabled} />
        <Button type="submit" disabled={disabled}>
          {buttonText}
        </Button>
      </fieldset>
    </form>
  );
}
