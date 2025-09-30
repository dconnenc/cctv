import { PollData } from '../types';
import { BaseBlockHandler } from './BaseBlockHandler';

export class PollHandler extends BaseBlockHandler<PollData> {
  constructor() {
    super({
      question: '',
      options: ['', ''],
      pollType: 'single',
    });
  }

  getDefaultState(): PollData {
    return {
      question: '',
      options: ['', ''],
      pollType: 'single',
    };
  }

  validate(): string | null {
    const validOptions = this.data.options.filter((opt) => opt.trim() !== '');

    if (!this.data.question.trim()) {
      return 'Poll question is required';
    }

    if (validOptions.length < 2) {
      return 'Poll must have at least 2 options';
    }

    return null;
  }

  buildPayload(): Record<string, any> {
    const validOptions = this.data.options.filter((opt) => opt.trim() !== '');

    return {
      type: 'poll',
      question: this.data.question.trim(),
      options: validOptions,
      pollType: this.data.pollType,
    };
  }
}
