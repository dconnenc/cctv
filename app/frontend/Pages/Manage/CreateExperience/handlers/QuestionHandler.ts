import { QuestionData } from '../types';
import { BaseBlockHandler } from './BaseBlockHandler';

export class QuestionHandler extends BaseBlockHandler<QuestionData> {
  constructor() {
    super({
      questionText: '',
      questionFormKey: '',
      questionInputType: 'text',
    });
  }

  getDefaultState(): QuestionData {
    return {
      questionText: '',
      questionFormKey: '',
      questionInputType: 'text',
    };
  }

  validate(): string | null {
    if (!this.data.questionText.trim()) {
      return 'Question text is required';
    }

    if (!this.data.questionFormKey.trim()) {
      return 'Question form key is required';
    }

    return null;
  }

  buildPayload(): Record<string, any> {
    return {
      type: 'question',
      question: this.data.questionText.trim(),
      formKey: this.data.questionFormKey.trim(),
      inputType: this.data.questionInputType,
    };
  }

  // Auto-generate form key when question text changes
  updateQuestionText(questionText: string): void {
    const formKey = questionText.split(' ').join('_').toLowerCase();
    this.updateData({
      questionText,
      questionFormKey: formKey,
    } as Partial<QuestionData>);
  }
}
