import { FormEvent, useState } from 'react';

import { Button, TextInput } from '@cctv/core';
import { ParticipantSummary, QuestionExperience } from '@cctv/types';
import { getFormData } from '@cctv/utils';

import styles from './Question.module.scss';

interface QuestionProps extends QuestionExperience {
  participant?: ParticipantSummary;
  buttonText?: string;
}

export default function Question({
  participant,
  question,
  formKey,
  buttonText = 'Submit',
}: QuestionProps) {
  const [submittedValue, setSubmittedValue] = useState<string>('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<{ [key: string]: string }>(e.currentTarget);
    const answer = formData[formKey];
    console.log(answer, formData, formKey);
    if (!answer) return;

    // TODO: Submit question via API
    console.log(answer, participant);
    setSubmittedValue(answer);
  };

  if (submittedValue) {
    return (
      <div>
        <p className={styles.legend}>{question}</p>
        <p className={styles.value}>{submittedValue}</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextInput label={question} name={formKey} />
      <Button type="submit">{buttonText}</Button>
    </form>
  );
}
