import { AnnouncementData } from '../types';
import { BaseBlockHandler } from './BaseBlockHandler';

export class AnnouncementHandler extends BaseBlockHandler<AnnouncementData> {
  constructor() {
    super({
      message: '',
    });
  }

  getDefaultState(): AnnouncementData {
    return {
      message: '',
    };
  }

  validate(): string | null {
    if (!this.data.message.trim()) {
      return 'Announcement message is required';
    }

    return null;
  }

  buildPayload(): Record<string, any> {
    return {
      type: 'announcement',
      message: this.data.message.trim(),
    };
  }
}
