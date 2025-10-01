import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { BlockStatus, ParticipantSummary } from '@cctv/types';
import { BlockComponentProps, PollApiPayload, PollData } from '@cctv/types';

import styles from './CreatePoll.module.scss';

export const getDefaultPollState = (): PollData => {
  return {
    question: '',
    options: ['', ''],
    pollType: 'single',
  };
};

export const validatePoll = (data: PollData): string | null => {
  const validOptions = data.options.filter((opt) => opt.trim() !== '');

  if (!data.question.trim()) {
    return 'Poll question is required';
  }

  if (validOptions.length < 2) {
    return 'Poll must have at least 2 options';
  }

  return null;
};

export const buildPollPayload = (data: PollData): PollApiPayload => {
  const validOptions = data.options.filter((opt) => opt.trim() !== '');

  return {
    type: 'poll',
    question: data.question.trim(),
    options: validOptions,
    pollType: data.pollType,
  };
};

export const canPollOpenImmediately = (
  _data: PollData,
  _participants: ParticipantSummary[],
): boolean => {
  return true;
};

export const processPollBeforeSubmit = (
  data: PollData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): PollData => {
  return data;
};

export default function CreatePoll({ data, onChange }: BlockComponentProps<PollData>) {
  const updateData = (updates: Partial<PollData>) => {
    onChange?.(updates);
  };

  const addOption = () => {
    const newOptions = [...data.options, ''];
    onChange?.({ options: newOptions });
  };

  const removeOption = (index: number) => {
    if (data.options.length <= 2) {
      return; // Don't remove if only 2 options left
    }

    const newOptions = data.options.filter((_, i) => i !== index);
    onChange?.({ options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...data.options];
    newOptions[index] = value;
    onChange?.({ options: newOptions });
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
                onChange={(e) => updateOption(index, e.target.value)}
              />
              {data.options.length > 2 && (
                <Button type="button" onClick={() => removeOption(index)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button type="button" onClick={addOption}>
          Add Option
        </Button>
      </div>
    </div>
  );
}
