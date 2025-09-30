import { useState } from 'react';

import classNames from 'classnames';

import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';
import { BlockStatus, ParticipantSummary } from '@cctv/types';

import { MultistepFormData } from '../types';

import styles from './CreateMultistepForm.module.scss';

// Pure functions for multistep form business logic
export const getDefaultMultistepFormState = (): MultistepFormData => {
  return {
    questions: [{ question: '', formKey: '', inputType: 'text' }],
  };
};

export const validateMultistepForm = (data: MultistepFormData): string | null => {
  const validQuestions = data.questions.filter((q) => q.question.trim() && q.formKey.trim());

  if (validQuestions.length === 0) {
    return 'At least one question is required for multistep form';
  }

  return null;
};

export const buildMultistepFormPayload = (data: MultistepFormData): Record<string, any> => {
  const validQuestions = data.questions.filter((q) => q.question.trim() && q.formKey.trim());

  return {
    type: 'multistep_form',
    questions: validQuestions.map((q) => ({
      type: 'question' as const,
      question: q.question.trim(),
      formKey: q.formKey.trim(),
      inputType: q.inputType as 'text' | 'number' | 'email' | 'password' | 'tel',
    })),
  };
};

export const canMultistepFormOpenImmediately = (
  _data: MultistepFormData,
  _participants: ParticipantSummary[],
): boolean => {
  return true;
};

export const processMultistepFormBeforeSubmit = (
  data: MultistepFormData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): MultistepFormData => {
  return data;
};

export default function CreateMultistepForm({
  className,
  multistepQuestions,
  setMultistepQuestions,
}: {
  className?: string;
  multistepQuestions: Array<{ question: string; formKey: string; inputType: string }>;
  setMultistepQuestions: (
    questions: Array<{ question: string; formKey: string; inputType: string }>,
  ) => void;
}) {
  const [questionIndexToFocus, setQuestionIndexToFocus] = useState(0);

  const addQuestion = () => {
    const newQuestions = [...multistepQuestions, { question: '', formKey: '', inputType: 'text' }];
    setMultistepQuestions(newQuestions);
  };

  const updateQuestion = (
    index: number,
    updates: Partial<{ question: string; formKey: string; inputType: string }>,
  ) => {
    const newQuestions = [...multistepQuestions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setMultistepQuestions(newQuestions);
  };
  return (
    <div className={classNames(styles.root, className)}>
      <div className={styles.questions}>
        {multistepQuestions.map((question, index) => (
          <div
            key={index}
            className={classNames(styles.question, {
              [styles.questionHidden]: index !== questionIndexToFocus,
            })}
          >
            <TextInput
              label={`Question ${index + 1}`}
              value={question.question}
              onChange={(e) => {
                const questionText = e.target.value;
                const formKey = questionText.split(' ').join('_').toLowerCase();
                updateQuestion(index, { question: questionText, formKey });
              }}
            />
            <Dropdown
              label="Input Type"
              value={question.inputType}
              onChange={(value) => updateQuestion(index, { inputType: value })}
              options={[
                { label: 'Text', value: 'text' },
                { label: 'Number', value: 'number' },
                { label: 'Email', value: 'email' },
                { label: 'Password', value: 'password' },
                { label: 'Phone', value: 'tel' },
              ]}
            />
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        {questionIndexToFocus > 0 && (
          <Button onClick={() => setQuestionIndexToFocus(questionIndexToFocus - 1)}>Back</Button>
        )}
        {questionIndexToFocus < multistepQuestions.length - 1 && (
          <Button onClick={() => setQuestionIndexToFocus(questionIndexToFocus + 1)}>Next</Button>
        )}
        {questionIndexToFocus === multistepQuestions.length - 1 && (
          <Button
            onClick={() => {
              addQuestion();
              setQuestionIndexToFocus(questionIndexToFocus + 1);
            }}
          >
            + Add new question
          </Button>
        )}
      </div>
    </div>
  );
}
