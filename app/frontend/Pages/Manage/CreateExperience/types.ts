import { Block, BlockStatus, MadLibSegment, MadLibVariable, ParticipantSummary } from '@cctv/types';

// Base data types for each block type
export interface PollData {
  question: string;
  options: string[];
  pollType: 'single' | 'multiple';
}

export interface QuestionData {
  questionText: string;
  questionFormKey: string;
  questionInputType: 'text' | 'number' | 'email' | 'password' | 'tel';
}

export interface MultistepFormData {
  questions: Array<{ question: string; formKey: string; inputType: string }>;
}

export interface AnnouncementData {
  message: string;
}

export interface MadLibData {
  segments: MadLibSegment[];
  variables: MadLibVariable[];
}

// Union type for all block data
export type BlockData = PollData | QuestionData | MultistepFormData | AnnouncementData | MadLibData;

// Base interface all block type handlers must implement
export interface BlockTypeHandler<T = BlockData> {
  // Data management
  getDefaultState(): T;
  getData(): T;
  updateData(data: Partial<T>): void;
  resetData(): void;

  // Validation and payload
  validate(): string | null;
  buildPayload(): Record<string, any>;

  // Block-specific logic
  canOpenImmediately(participants: ParticipantSummary[]): boolean;
  processBeforeSubmit(status: BlockStatus, participants: ParticipantSummary[]): void;
}

// Context interface
export interface CreateBlockContextValue {
  // Block type
  kind: Block['kind'];
  setKind: (kind: Block['kind']) => void;

  // Handler
  handler: BlockTypeHandler;

  // Participants
  participants: ParticipantSummary[];

  // Form submission
  submit: (status: BlockStatus) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;

  // Additional form state
  visibleRoles: string[];
  setVisibleRoles: (roles: string[]) => void;
  visibleSegmentsText: string;
  setVisibleSegmentsText: (text: string) => void;
  targetUserIdsText: string;
  setTargetUserIdsText: (text: string) => void;
  viewAdditionalDetails: boolean;
  setViewAdditionalDetails: (view: boolean) => void;
}

// Props interface for block components
export interface BlockComponentProps<T = BlockData> {
  data: T;
  onChange?: (data: Partial<T>) => void;
  participants?: ParticipantSummary[];
}
