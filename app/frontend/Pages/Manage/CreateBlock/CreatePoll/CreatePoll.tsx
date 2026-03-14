import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core/Button/Button';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockComponentProps,
  BlockKind,
  BlockStatus,
  ParticipantSummary,
  PollApiPayload,
  PollData,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';
import styles from './CreatePoll.module.scss';

export const getDefaultPollState = (): PollData => {
  return {
    question: '',
    options: ['', ''],
    pollType: 'single',
    segmentAssignments: {},
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

  const payload: PollApiPayload = {
    type: BlockKind.POLL,
    question: data.question.trim(),
    options: validOptions,
    pollType: data.pollType,
  };

  // Only include segment assignments that map to valid options
  const validAssignments: Record<string, string> = {};
  for (const option of validOptions) {
    if (data.segmentAssignments[option]) {
      validAssignments[option] = data.segmentAssignments[option];
    }
  }
  if (Object.keys(validAssignments).length > 0) {
    payload.segmentAssignments = validAssignments;
  }

  return payload;
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
  const { experience } = useExperience();
  const definedSegments = experience?.segments || [];

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

    const removedOption = data.options[index];
    const newOptions = data.options.filter((_, i) => i !== index);

    // Clean up segment assignment for removed option
    const newAssignments = { ...data.segmentAssignments };
    delete newAssignments[removedOption];

    onChange?.({ options: newOptions, segmentAssignments: newAssignments });
  };

  const updateOption = (index: number, value: string) => {
    const oldValue = data.options[index];
    const newOptions = [...data.options];
    newOptions[index] = value;

    // Move segment assignment to new option name
    const newAssignments = { ...data.segmentAssignments };
    if (oldValue in newAssignments) {
      newAssignments[value] = newAssignments[oldValue];
      delete newAssignments[oldValue];
    }

    onChange?.({ options: newOptions, segmentAssignments: newAssignments });
  };

  const updateSegmentAssignment = (option: string, segmentId: string) => {
    const newAssignments = { ...data.segmentAssignments };
    if (segmentId) {
      newAssignments[option] = segmentId;
    } else {
      delete newAssignments[option];
    }
    updateData({ segmentAssignments: newAssignments });
  };

  return (
    <div className={sharedStyles.columns}>
      <div className={sharedStyles.column}>
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
      <div className={sharedStyles.column}>
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
              {definedSegments.length > 0 && option.trim() !== '' && (
                <Dropdown
                  label="Assign segment"
                  options={[
                    { label: 'None', value: '' },
                    ...definedSegments.map((s) => ({ label: s.name, value: s.id })),
                  ]}
                  value={data.segmentAssignments[option] || ''}
                  onChange={(value) => updateSegmentAssignment(option, value)}
                />
              )}
              {data.options.length > 2 && (
                <Button variant="ghost" type="button" onClick={() => removeOption(index)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="secondary" type="button" onClick={addOption}>
          Add Option
        </Button>
      </div>
    </div>
  );
}
