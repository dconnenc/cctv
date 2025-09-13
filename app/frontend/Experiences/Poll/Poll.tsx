import { FormEvent } from 'react';
import { Participant, PollExperience } from '@cctv/types';
import { Option, Button } from '@cctv/core';

import styles from './Poll.module.scss';

interface PollProps extends PollExperience {
  user: Participant;
}

export default function Poll({ user, question, options, pollType }: PollProps) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedOptions = formData.getAll('selectedOptions') as string[];
    console.log(selectedOptions, user);

    // TODO: Submit poll via API
  };

  return (
    <form onSubmit={onSubmit}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{question}</legend>
        {options.map((option) => (
          <Option
            allowMultiple={pollType === 'multiple'}
            key={option}
            option={option}
            name="selectedOptions"
          />
        ))}
        <Button type="submit">Submit</Button>
      </fieldset>
    </form>
  );
}
