import { FormEvent, useState } from 'react';

import { Button, TextInput } from '@cctv/core';
import { UserWithRole, QuestionExperience } from '@cctv/types';
import { getFormData } from '@cctv/utils';

import styles from './Question.module.scss';

interface QuestionProps extends QuestionExperience {
  user?: UserWithRole;
  buttonText?: string;
}

export default function Question({
  user,
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
    console.log(answer, user);
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
