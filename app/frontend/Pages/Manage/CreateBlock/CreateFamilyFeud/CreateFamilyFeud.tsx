import { Sparkles, X } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  Block,
  BlockComponentProps,
  BlockKind,
  FamilyFeudData,
  FamilyFeudPayload,
} from '@cctv/types';

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

  // Synthetic questions may be created without a question string — it can be
  // supplied later on the manage screen before generating answers.
  const validQuestions = data.questions.filter((q) => q.synthetic || q.question.trim());

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
    questions: data.questions.filter((q) => q.synthetic || q.question.trim()),
  };
};

export const buildFamilyFeudPayload = (data: FamilyFeudData) => {
  return {
    type: 'family_feud' as const,
    title: data.title.trim(),
  };
};

export const familyFeudPayloadToFormData = (
  payload: FamilyFeudPayload,
  children?: Block[],
): FamilyFeudData => ({
  title: payload.title || '',
  questions: (children || []).map((child) => {
    const childPayload = child.kind === BlockKind.QUESTION ? child.payload : null;
    return {
      id: child.id,
      question: childPayload?.question || '',
      synthetic: childPayload?.synthetic ?? false,
    };
  }),
});

export type FamilyFeudQuestionPayload = {
  question: string;
  formKey: string;
  inputType: string;
  synthetic?: boolean;
};

export const buildFamilyFeudQuestions = (
  data: FamilyFeudData,
): Array<{ payload: FamilyFeudQuestionPayload }> => {
  return data.questions
    .filter((q) => q.synthetic || q.question.trim())
    .map((q, index) => {
      const payload: FamilyFeudQuestionPayload = {
        question: q.question.trim(),
        formKey: `answer_${index}`,
        inputType: 'text',
      };

      // Synthetic questions carry no question text or count at creation — both
      // are supplied on the manage screen before dispatching to the agent.
      if (q.synthetic) {
        payload.synthetic = true;
      }

      return { payload };
    });
};

export default function CreateFamilyFeud({ data, onChange }: BlockComponentProps<FamilyFeudData>) {
  const addQuestion = (synthetic = false) => {
    const newQuestion = {
      id: Date.now().toString(),
      question: '',
      synthetic,
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

      {data.questions.map((question, index) =>
        question.synthetic ? (
          <div key={question.id} className={`${styles.questionItem} ${styles.syntheticItem}`}>
            <div className={styles.questionNumber}>
              <Sparkles size={16} />
            </div>
            <div className={styles.questionField}>
              <div className={styles.syntheticLabel}>Synthetic Question {index + 1}</div>
              <div className={styles.syntheticBadge}>
                AI-generated — the question and number of answers are set on the manage screen. Not
                shown to participants.
              </div>
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => removeQuestion(index)}
              className={styles.removeButton}
            >
              <X size={16} />
            </Button>
          </div>
        ) : (
          <div key={question.id} className={styles.questionItem}>
            <div className={styles.questionNumber}>{index + 1}</div>
            <div className={styles.questionField}>
              <TextInput
                label={`Question ${index + 1}`}
                placeholder="Enter question"
                value={question.question}
                onChange={(e) => updateQuestion(index, e.target.value)}
                required
              />
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => removeQuestion(index)}
              className={styles.removeButton}
            >
              <X size={16} />
            </Button>
          </div>
        ),
      )}

      <div className={styles.addButtons}>
        <Button variant="secondary" type="button" onClick={() => addQuestion(false)}>
          Add Question
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => addQuestion(true)}
          icon={<Sparkles size={16} />}
        >
          Add Synthetic Question
        </Button>
      </div>
    </div>
  );
}
