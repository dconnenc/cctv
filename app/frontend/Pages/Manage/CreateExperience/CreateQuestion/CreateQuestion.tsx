import { TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { BlockStatus, ParticipantSummary } from '@cctv/types';
import { BlockComponentProps, QuestionData } from '@cctv/types';

import styles from './CreateQuestion.module.scss';

export const getDefaultQuestionState = (): QuestionData => {
  return {
    questionText: '',
    questionFormKey: '',
    questionInputType: 'text',
  };
};

export const validateQuestion = (data: QuestionData): string | null => {
  if (!data.questionText.trim()) {
    return 'Question text is required';
  }

  if (!data.questionFormKey.trim()) {
    return 'Question form key is required';
  }

  return null;
};

export const buildQuestionPayload = (data: QuestionData): Record<string, any> => {
  return {
    type: 'question',
    question: data.questionText.trim(),
    formKey: data.questionFormKey.trim(),
    inputType: data.questionInputType,
  };
};

export const canQuestionOpenImmediately = (
  _data: QuestionData,
  _participants: ParticipantSummary[],
): boolean => {
  return true;
};

export const processQuestionBeforeSubmit = (
  data: QuestionData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): QuestionData => {
  return data;
};

export default function CreateQuestion({ data, onChange }: BlockComponentProps<QuestionData>) {
  const updateData = (updates: Partial<QuestionData>) => {
    onChange?.(updates);
  };

  const updateQuestionText = (questionText: string) => {
    const formKey = questionText.split(' ').join('_').toLowerCase();
    onChange?.({
      questionText,
      questionFormKey: formKey,
    });
  };
  return (
    <div className={styles.details}>
      <div className={styles.left}>
        <TextInput
          label="Question"
          placeholder="What is your question?"
          required
          value={data.questionText}
          onChange={(e) => updateQuestionText(e.target.value)}
        />
        <Dropdown
          label="Input Type"
          options={[
            { label: 'Text', value: 'text' },
            { label: 'Number', value: 'number' },
            { label: 'Email', value: 'email' },
            { label: 'Password', value: 'password' },
            { label: 'Phone', value: 'tel' },
          ]}
          required
          value={data.questionInputType}
          onChange={(value) =>
            updateData({ questionInputType: value as QuestionData['questionInputType'] })
          }
        />
      </div>
    </div>
  );
}
