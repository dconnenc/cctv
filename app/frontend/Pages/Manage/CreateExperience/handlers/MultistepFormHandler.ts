import { MultistepFormData } from '../types';
import { BaseBlockHandler } from './BaseBlockHandler';

export class MultistepFormHandler extends BaseBlockHandler<MultistepFormData> {
  constructor() {
    super({
      questions: [{ question: '', formKey: '', inputType: 'text' }],
    });
  }

  getDefaultState(): MultistepFormData {
    return {
      questions: [{ question: '', formKey: '', inputType: 'text' }],
    };
  }

  validate(): string | null {
    const validQuestions = this.data.questions.filter((q) => q.question.trim() && q.formKey.trim());

    if (validQuestions.length === 0) {
      return 'At least one question is required for multistep form';
    }

    return null;
  }

  buildPayload(): Record<string, any> {
    const validQuestions = this.data.questions.filter((q) => q.question.trim() && q.formKey.trim());

    return {
      type: 'multistep_form',
      questions: validQuestions.map((q) => ({
        type: 'question' as const,
        question: q.question.trim(),
        formKey: q.formKey.trim(),
        inputType: q.inputType as 'text' | 'number' | 'email' | 'password' | 'tel',
      })),
    };
  }
}
