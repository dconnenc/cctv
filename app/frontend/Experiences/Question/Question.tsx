import { FormEvent, useEffect, useRef, useState } from 'react';

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
  const [submittedValue, setSubmittedValue] = useState<string>('');
  const { submitQuestionResponse, isLoading, error } = useSubmitQuestionResponse();
  const userAlreadyResponded = responses?.user_responded || false;
  const currentBlockIdRef = useRef(blockId);

  useEffect(() => {
    // Using http and ws causes weird submission race conditions if the rendered
    // block is the same type.
    currentBlockIdRef.current = blockId;
    setSubmittedValue('');
  }, [blockId]);

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

    const submittedBlockId = actualBlockId;

    const response = await submitQuestionResponse({
      blockId: actualBlockId,
      answer: {
        value: value,
        submittedAt: new Date().toISOString(),
      },
    });

    if (response?.success && currentBlockIdRef.current === submittedBlockId) {
      setSubmittedValue(value);
    } else if (response?.success) {
      console.log('[QA] Skipping setSubmittedValue - blockId changed during submission');
    }
  };

  if (submittedValue || userAlreadyResponded) {
    const displayValue =
      submittedValue ||
      responses?.user_response?.answer?.value ||
      'You have already responded to this question.';

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
    <form className={styles.form} onSubmit={onSubmit}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{question}</legend>
        {error && <p className={styles.error}>{error}</p>}
        <TextInput key={blockId} name={formKey} type={inputType} required disabled={disabled} />
        <Button type="submit" loading={isLoading} loadingText="Submitting..." disabled={disabled}>
          {buttonText}
        </Button>
      </fieldset>
    </form>
  );
}
