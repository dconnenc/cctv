import { X } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { TextInput } from '@cctv/core/TextInput/TextInput';
import { BlockComponentProps, FamilyFeudData } from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';
import styles from './CreateFamilyFeud.module.scss';

export const getDefaultFamilyFeudState = (): FamilyFeudData => {
  return {
    title: '',
    questions: [],
  };
};

export const validateFamilyFeud = (data: FamilyFeudData): string | null => {
  if (!data.title.trim()) {
    return 'Family Feud must have a title';
  }

  const validQuestions = data.questions.filter((q) => q.question.trim());

  if (validQuestions.length === 0) {
    return 'Family Feud must have at least one question';
  }

  return null;
};

export const canFamilyFeudOpenImmediately = (): boolean => {
  return true;
};

export const processFamilyFeudBeforeSubmit = (data: FamilyFeudData): FamilyFeudData => {
  return {
    ...data,
    questions: data.questions.filter((q) => q.question.trim()),
  };
};

export const buildFamilyFeudPayload = (data: FamilyFeudData) => {
  return {
    type: 'family_feud' as const,
    title: data.title.trim(),
  };
};

export const buildFamilyFeudQuestions = (data: FamilyFeudData) => {
  return data.questions
    .filter((q) => q.question.trim())
    .map((q, index) => ({
      payload: {
        question: q.question.trim(),
        formKey: `answer_${index}`,
        inputType: 'text',
      },
    }));
};

export default function CreateFamilyFeud({ data, onChange }: BlockComponentProps<FamilyFeudData>) {
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      question: '',
    };
    onChange?.({ questions: [...data.questions, newQuestion] });
  };

  const updateQuestion = (index: number, question: string) => {
    const newQuestions = [...data.questions];
    newQuestions[index] = { ...newQuestions[index], question };
    onChange?.({ questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = data.questions.filter((_, i) => i !== index);
    onChange?.({ questions: newQuestions });
  };

  return (
    <div className={sharedStyles.container}>
      <div className={styles.titleInput}>
        <TextInput
          label="Title"
          placeholder="Enter the Family Feud game title"
          value={data.title}
          onChange={(e) => onChange?.({ title: e.target.value })}
          required
        />
      </div>

      <div className={sharedStyles.sectionTitle}>Questions</div>

      {data.questions.map((question, index) => (
        <div key={question.id} className={styles.questionItem}>
          <div className={styles.questionNumber}>{index + 1}</div>
          <div className={styles.questionField}>
            <TextInput
              placeholder="Enter question"
              value={question.question}
              onChange={(e) => updateQuestion(index, e.target.value)}
              required
            />
          </div>
          <Button
            type="button"
            onClick={() => removeQuestion(index)}
            className={styles.removeButton}
          >
            <X size={16} />
          </Button>
        </div>
      ))}

      <Button type="button" onClick={addQuestion}>
        Add Question
      </Button>
    </div>
  );
}
