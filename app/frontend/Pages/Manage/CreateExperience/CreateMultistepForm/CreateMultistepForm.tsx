import { useState } from 'react';

import classNames from 'classnames';

import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';

import styles from './CreateMultistepForm.module.scss';

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
                const newQuestions = [...multistepQuestions];
                newQuestions[index].question = e.target.value;
                newQuestions[index].formKey = e.target.value.split(' ').join('_').toLowerCase();
                setMultistepQuestions(newQuestions);
              }}
            />
            <Dropdown
              label="Input Type"
              value={question.inputType}
              onChange={(value) => {
                const newQuestions = [...multistepQuestions];
                newQuestions[index].inputType = value;
                setMultistepQuestions(newQuestions);
              }}
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
              setMultistepQuestions([
                ...multistepQuestions,
                { question: '', formKey: '', inputType: 'text' },
              ]);

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
