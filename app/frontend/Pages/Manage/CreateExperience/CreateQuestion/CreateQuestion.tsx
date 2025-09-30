import { TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';

import { BlockComponentProps, QuestionData } from '../types';

import styles from './CreateQuestion.module.scss';

export default function CreateQuestion({ data, onChange }: BlockComponentProps<QuestionData>) {
  const updateData = (updates: Partial<QuestionData>) => {
    onChange?.(updates);
  };
  return (
    <div className={styles.details}>
      <div className={styles.left}>
        <TextInput
          label="Question"
          placeholder="What is your question?"
          required
          value={data.questionText}
          onChange={(e) => {
            const newQuestionText = e.target.value;
            const formKey = newQuestionText.split(' ').join('_').toLowerCase();
            updateData({
              questionText: newQuestionText,
              questionFormKey: formKey,
            });
          }}
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
