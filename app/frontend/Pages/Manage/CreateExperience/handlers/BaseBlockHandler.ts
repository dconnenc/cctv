import { BlockStatus, ParticipantSummary } from '@cctv/types';

import { BlockData, BlockTypeHandler } from '../types';

export abstract class BaseBlockHandler<T extends BlockData = BlockData>
  implements BlockTypeHandler<T>
{
  protected data: T;

  constructor(defaultData: T) {
    this.data = defaultData;
  }

  abstract getDefaultState(): T;
  abstract validate(): string | null;
  abstract buildPayload(): Record<string, any>;

  getData(): T {
    return this.data;
  }

  updateData(newData: Partial<T>): void {
    this.data = { ...this.data, ...newData };
  }

  resetData(): void {
    this.data = this.getDefaultState();
  }

  // Default implementation - can be overridden by specific handlers
  canOpenImmediately(participants: ParticipantSummary[]): boolean {
    return true;
  }

  // Default implementation - can be overridden by specific handlers
  processBeforeSubmit(status: BlockStatus, participants: ParticipantSummary[]): void {
    // Base implementation does nothing
  }
}
