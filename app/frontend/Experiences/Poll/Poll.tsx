import { FormEvent, useState } from 'react';

import { Button, Option } from '@cctv/core';
import { Participant, PollExperience } from '@cctv/types';
import { getFormData } from '@cctv/utils';

import styles from './Poll.module.scss';

interface PollProps extends PollExperience {
  user: Participant;
}

export default function Poll({ user, question, options, pollType }: PollProps) {
  const [submittedValue, setSubmittedValue] = useState<string[]>([]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormData<{ selectedOptions: string[] }>(e.currentTarget);
    const selectedOptions = formData.selectedOptions;

    // TODO: Submit poll via API
    console.log(selectedOptions, user);
    const value = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions ?? ''];
    setSubmittedValue(value);
  };

  if (submittedValue.length > 0) {
    return (
      <div className={styles.submittedValue}>
        <p className={styles.legend}>{question}</p>
        <p className={styles.value}>{submittedValue.join(', ')}</p>
      </div>
    );
  }

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
