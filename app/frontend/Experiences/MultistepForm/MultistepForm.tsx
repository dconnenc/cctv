import { FormEvent, useState } from 'react';

import classNames from 'classnames';

import { Button, TextInput } from '@cctv/core';
import { MultistepFormExperience, Participant } from '@cctv/types';
import { getFormData, isNotEmpty } from '@cctv/utils';

import styles from './MultistepForm.module.scss';

interface MultistepFormProps extends MultistepFormExperience {
  /** Optional callback for when form is submitted successfully. */
  onSubmit?: (formData: Record<string, string>) => void;

  /** The user who is filling out the form. */
  user: Participant;

  /** A function that validates the form data. Returns an array of errored question keys. */
  validation?: (formData: Partial<Record<string, string>>) => string[];
}

/** A multistep form experience. Transitions between questions so user only sees one at a time. */
export default function MultistepForm({
  onSubmit,
  user,
  questions,
  validation,
}: MultistepFormProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [stepErrors, setStepErrors] = useState<Set<string>>(new Set());
  const [submittedValue, setSubmittedValue] = useState<Record<string, string>>();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;

    e.preventDefault();
    setStepErrors(new Set());

    const formData = getFormData<Record<string, string>>(form);

    const errors = validation ? validation(formData) : defaultValidation(formData);

    if (isNotEmpty(errors)) {
      const firstErrorKey = errors[0];
      const firstErrorIndex = questions.findIndex((question) => question.formKey === firstErrorKey);
      setStepIndex(firstErrorIndex);
      setStepErrors(new Set(errors));
      return;
    }

    setSubmittedValue(formData as Record<string, string>);

    if (onSubmit) {
      onSubmit(formData as Record<string, string>);
      return;
    }

    // TODO: Submit question via API
    console.log('Submitting form data:', formData, user);
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

  if (submittedValue) {
    return (
      <div className={styles.submittedValue}>
        {questions.map((question) => (
          <div key={question.formKey}>
            <p className={styles.legend}>{question.question}</p>
            <p className={styles.value}>{submittedValue[question.formKey]}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} onInvalid={handleInvalidForm}>
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
                type={question.inputType}
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
        {stepIndex > 0 && <Button onClick={goBack}>Back</Button>}
        {stepIndex < questions.length - 1 && <Button onClick={goForward}>Next</Button>}
        {isLastQuestion && <Button type="submit">Submit</Button>}
      </div>
    </form>
  );
}

const defaultValidation = (formData: Partial<Record<string, string>>) => {
  return Object.keys(formData)
    .filter((key) => !isNotEmpty(formData[key]))
    .map((key) => key);
};
