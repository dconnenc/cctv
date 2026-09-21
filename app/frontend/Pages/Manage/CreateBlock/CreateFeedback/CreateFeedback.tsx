import { useId } from 'react';

import { Switch, TextInput } from '@cctv/core';
import {
  BlockComponentProps,
  BlockKind,
  BlockStatus,
  FEEDBACK_TYPE_LABELS,
  FeedbackApiPayload,
  FeedbackData,
  FeedbackPayload,
  FeedbackType,
  ParticipantSummary,
} from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';
import styles from './CreateFeedback.module.scss';

const ALL_TYPES = [
  FeedbackType.EXPERIENCE,
  FeedbackType.BUG,
  FeedbackType.GENERAL,
  FeedbackType.OTHER,
];

export const getDefaultFeedbackState = (): FeedbackData => ({
  prompt: 'How was the show?',
  allowed_types: [FeedbackType.EXPERIENCE, FeedbackType.BUG, FeedbackType.GENERAL],
  require_title: false,
});

export const validateFeedback = (data: FeedbackData): string | null => {
  if (!data.prompt.trim()) {
    return 'Feedback prompt is required';
  }

  if (data.allowed_types.length === 0) {
    return 'Pick at least one feedback type';
  }

  return null;
};

export const buildFeedbackPayload = (data: FeedbackData): FeedbackApiPayload => ({
  type: BlockKind.FEEDBACK,
  prompt: data.prompt.trim(),
  allowed_types: data.allowed_types,
  require_title: data.require_title,
});

export const canFeedbackOpenImmediately = (
  _data: FeedbackData,
  _participants: ParticipantSummary[],
): boolean => true;

export const feedbackPayloadToFormData = (payload: FeedbackPayload): FeedbackData => ({
  prompt: payload.prompt || '',
  allowed_types: payload.allowed_types?.length ? payload.allowed_types : ALL_TYPES,
  require_title: payload.require_title ?? false,
});

export const processFeedbackBeforeSubmit = (
  data: FeedbackData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): FeedbackData => data;

export default function CreateFeedback({ data, onChange }: BlockComponentProps<FeedbackData>) {
  const requireTitleId = useId();

  const toggleType = (type: FeedbackType) => {
    const next = data.allowed_types.includes(type)
      ? data.allowed_types.filter((item) => item !== type)
      : [...data.allowed_types, type];

    onChange?.({ allowed_types: next });
  };

  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Prompt"
        placeholder="How was the show?"
        required
        value={data.prompt}
        onChange={(event) => onChange?.({ prompt: event.target.value })}
      />

      <fieldset className={styles.types}>
        <legend className={styles.legend}>Feedback types offered</legend>
        <div className={styles.typeOptions}>
          {ALL_TYPES.map((type) => (
            <label key={type} className={styles.typeOption}>
              <input
                type="checkbox"
                checked={data.allowed_types.includes(type)}
                onChange={() => toggleType(type)}
              />
              {FEEDBACK_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.switchRow}>
        <Switch
          id={requireTitleId}
          checked={data.require_title}
          onCheckedChange={(checked) => onChange?.({ require_title: checked })}
        />
        <label htmlFor={requireTitleId}>Require a title</label>
      </div>
    </div>
  );
}
