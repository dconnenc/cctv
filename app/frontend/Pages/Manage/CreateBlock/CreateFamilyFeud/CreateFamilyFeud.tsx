import { Sparkles, X } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  DEFAULT_SYNTHETIC_COUNT,
  MAX_SYNTHETIC_COUNT,
  MIN_SYNTHETIC_COUNT,
  clampSyntheticCount,
} from '@cctv/pages/Block/FamilyFeudManager/synthetic';
import {
  Block,
  BlockComponentProps,
  FamilyFeudData,
  FamilyFeudPayload,
  QuestionPayload,
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
    const childPayload = child.payload as QuestionPayload;
    return {
      id: child.id,
      question: childPayload.question || '',
      synthetic: childPayload.synthetic ?? false,
      generateCount: childPayload.generate_count ?? DEFAULT_SYNTHETIC_COUNT,
    };
  }),
});

export const buildFamilyFeudQuestions = (
  data: FamilyFeudData,
): Array<{ payload: Record<string, string | number | boolean> }> => {
  return data.questions
    .filter((q) => q.synthetic || q.question.trim())
    .map((q, index) => {
      const payload: Record<string, string | number | boolean> = {
        question: q.question.trim(),
        formKey: `answer_${index}`,
        inputType: 'text',
      };

      if (q.synthetic) {
        payload.synthetic = true;
        payload.generate_count = clampSyntheticCount(q.generateCount);
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
      generateCount: synthetic ? DEFAULT_SYNTHETIC_COUNT : undefined,
    };
    onChange?.({ questions: [...data.questions, newQuestion] });
  };

  const updateQuestion = (index: number, question: string) => {
    const newQuestions = [...data.questions];
    newQuestions[index] = { ...newQuestions[index], question };
    onChange?.({ questions: newQuestions });
  };

  const updateGenerateCount = (index: number, generateCount: number) => {
    const newQuestions = [...data.questions];
    newQuestions[index] = { ...newQuestions[index], generateCount };
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
        <div
          key={question.id}
          className={`${styles.questionItem} ${question.synthetic ? styles.syntheticItem : ''}`}
        >
          <div className={styles.questionNumber}>
            {question.synthetic ? <Sparkles size={16} /> : index + 1}
          </div>
          <div className={styles.questionField}>
            {question.synthetic && (
              <div className={styles.syntheticBadge}>
                AI-generated — not shown to participants. The question can also be set later.
              </div>
            )}
            <TextInput
              label={
                question.synthetic ? `Synthetic Question ${index + 1}` : `Question ${index + 1}`
              }
              placeholder="Enter question"
              value={question.question}
              onChange={(e) => updateQuestion(index, e.target.value)}
              required={!question.synthetic}
            />
            {question.synthetic && (
              <TextInput
                type="number"
                label="Answers to generate"
                value={String(question.generateCount ?? DEFAULT_SYNTHETIC_COUNT)}
                min={MIN_SYNTHETIC_COUNT}
                max={MAX_SYNTHETIC_COUNT}
                onChange={(e) =>
                  updateGenerateCount(index, clampSyntheticCount(Number(e.target.value)))
                }
              />
            )}
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
      ))}

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
