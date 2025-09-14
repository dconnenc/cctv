import { FormEvent } from 'react';

import { Button, TextInput } from '@cctv/core';
import { Participant, QuestionExperience } from '@cctv/types';
import { getFormData } from '@cctv/utils';

import styles from './Question.module.scss';

interface QuestionProps extends QuestionExperience {
  user?: Participant;
  buttonText?: string;
}

export default function Question({ user, question, key, buttonText = 'Submit' }: QuestionProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<{ [key: string]: string }>(e.currentTarget);
    const answer = formData[key];
    if (!answer) return;

    // TODO: Submit question via API
    console.log(answer, user);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextInput label={question} name={key} />
      <Button type="submit">{buttonText}</Button>
    </form>
  );
}
