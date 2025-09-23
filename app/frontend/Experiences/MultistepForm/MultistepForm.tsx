import { FormEvent, useState } from 'react';

import classNames from 'classnames';

import { Button, TextInput } from '@cctv/core';
import { useSubmitMultistepFormResponse } from '@cctv/hooks/useSubmitMultistepFormResponse';
import { MultistepFormPayload } from '@cctv/types';
import { getFormData, isNotEmpty } from '@cctv/utils';

import styles from './MultistepForm.module.scss';

interface MultistepFormProps extends MultistepFormPayload {
  blockId?: string;
  responses?: {
    total: number;
    user_responded: boolean;
    user_response?: {
      id: string;
      answer: any;
    } | null;
  };
}

/** A multistep form experience. Transitions between questions so user only sees one at a time. */
export default function MultistepForm({ questions, blockId, responses }: MultistepFormProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [stepErrors, setStepErrors] = useState<Set<string>>(new Set());
  const [submittedValue, setSubmittedValue] = useState<Record<string, string>>();
  const { submitMultistepFormResponse, isLoading, error } = useSubmitMultistepFormResponse();
  const userAlreadyResponded = responses?.user_responded || false;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;

    e.preventDefault();
    setStepErrors(new Set());

    const formData = getFormData<Record<string, string>>(form);

    const errors = defaultValidation(formData);

    if (isNotEmpty(errors)) {
      const firstErrorKey = errors[0];
      const firstErrorIndex = questions.findIndex((question) => question.formKey === firstErrorKey);
      setStepIndex(firstErrorIndex);
      setStepErrors(new Set(errors));
      return;
    }

    // Get the block ID from props or URL query params
    const actualBlockId = blockId || new URLSearchParams(window.location.search).get('blockId');

    if (!actualBlockId) {
      console.error('No block ID found');
      return;
    }

    const response = await submitMultistepFormResponse({
      blockId: actualBlockId,
      answer: {
        responses: formData as Record<string, string>,
        submittedAt: new Date().toISOString(),
      },
    });

    if (response?.success) {
      setSubmittedValue(formData as Record<string, string>);
    }
  };

  const handleInvalidForm = (e: FormEvent<HTMLFormElement>) => {
    const problemInput = e.target;
    const problemInputKey = (problemInput as HTMLInputElement).name;
    const problemIndex = questions.findIndex((question) => question.formKey === problemInputKey);
    setStepErrors((errors) => new Set([...errors, problemInputKey]));
    setStepIndex(problemIndex);
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex(stepIndex - 1);
  };

  const goForward = () => {
    if (stepIndex === questions.length - 1) return;
    setStepIndex(stepIndex + 1);
  };

  const isLastQuestion = stepIndex === questions.length - 1;

  if (submittedValue || userAlreadyResponded) {
    const responseData = submittedValue || responses?.user_response?.answer?.responses;

    return (
      <div className={styles.submittedValue}>
        {responseData ? (
          questions.map((question) => (
            <div key={question.formKey} className={styles.submittedAnswer}>
              <p className={styles.legend}>{question.question}</p>
              <p className={styles.value}>{responseData[question.formKey]}</p>
            </div>
          ))
        ) : (
          <p className={styles.value}>You have already responded to this form.</p>
        )}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} onInvalid={handleInvalidForm}>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.questions}>
        {questions.map((question, index) => {
          const isCurrentQuestion = index === stepIndex;
          const errorId = `${question.formKey}-error`;
          const hasError = stepErrors.has(question.formKey);
          return (
            <div
              className={classNames(styles.question, {
                [styles.questionHidden]: !isCurrentQuestion,
              })}
              key={question.formKey}
            >
              <TextInput
                required
                type={question.inputType || 'text'}
                label={question.question}
                name={question.formKey}
                aria-describedby={hasError ? errorId : undefined}
              />
              {hasError && (
                <p id={errorId} role="alert" className={styles.error}>
                  This question is required
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.buttons}>
        {stepIndex > 0 && (
          <Button onClick={goBack} loading={isLoading} loadingText="Loading...">
            Back
          </Button>
        )}
        {stepIndex < questions.length - 1 && (
          <Button onClick={goForward} loading={isLoading} loadingText="Loading...">
            Next
          </Button>
        )}
        {isLastQuestion && (
          <Button type="submit" loading={isLoading} loadingText="Submitting...">
            Submit
          </Button>
        )}
      </div>
    </form>
  );
}

const defaultValidation = (formData: Partial<Record<string, string>>) => {
  return Object.keys(formData)
    .filter((key) => !isNotEmpty(formData[key]))
    .map((key) => key);
};
