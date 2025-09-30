import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';

import { BlockComponentProps, PollData } from '../types';

import styles from './CreatePoll.module.scss';

export default function CreatePoll({ data, onChange }: BlockComponentProps<PollData>) {
  const updateData = (updates: Partial<PollData>) => {
    onChange?.(updates);
  };
  return (
    <div className={styles.details}>
      <div className={styles.left}>
        <TextInput
          label="Poll Question"
          placeholder="What is your question?"
          required
          value={data.question}
          onChange={(e) => {
            updateData({ question: e.target.value });
          }}
        />
        <Dropdown
          label="Poll Type"
          options={[
            { label: 'Single Choice', value: 'single' },
            { label: 'Multiple Choice', value: 'multiple' },
          ]}
          required
          value={data.pollType}
          onChange={(value) => updateData({ pollType: value as 'single' | 'multiple' })}
        />
      </div>
      <div className={styles.right}>
        <div className={styles.list}>
          {data.options.map((option, index) => (
            <div className={styles.item} key={index}>
              <TextInput
                key={index}
                label={`Option ${index + 1}`}
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => {
                  const newOptions = [...data.options];
                  newOptions[index] = e.target.value;
                  updateData({ options: newOptions });
                }}
              />
              {data.options.length > 2 && (
                <Button
                  type="button"
                  onClick={() => {
                    const newOptions = data.options.filter((_, i) => i !== index);
                    updateData({ options: newOptions });
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => {
            const newOptions = [...data.options, ''];
            updateData({ options: newOptions });
          }}
        >
          Add Option
        </Button>
      </div>
    </div>
  );
}
