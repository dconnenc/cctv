// ===== CORE DOMAIN TYPES =====

export type UserRole = 'user' | 'admin' | 'superadmin';
export type ExperienceStatus = 'draft' | 'lobby' | 'live' | 'paused' | 'finished' | 'archived';
export type ParticipantRole = 'audience' | 'player' | 'moderator' | 'host';
export type ParticipantStatus = 'registered' | 'active';
export type BlockStatus = 'hidden' | 'open' | 'closed';
export enum BlockKind {
  POLL = 'poll',
  QUESTION = 'question',
  MULTISTEP_FORM = 'multistep_form',
  ANNOUNCEMENT = 'announcement',
  MAD_LIB = 'mad_lib',
}

// ===== BLOCK PAYLOAD TYPES =====

export interface PollPayload {
  question: string;
  options: string[];
  pollType?: 'single' | 'multiple';
}

export interface QuestionPayload {
  question: string;
  formKey: string;
  inputType?: 'text' | 'number' | 'email' | 'password' | 'tel';
}

export interface MultistepFormPayload {
  questions: QuestionPayload[];
}

export interface AnnouncementPayload {
  message: string;
}

export interface MadLibVariable {
  id: string;
  name: string;
  question: string;
  dataType: 'text' | 'number' | 'adjective' | 'noun' | 'verb' | 'adverb';
  assigned_user_id?: string;
}

export interface MadLibSegment {
  id: string;
  type: 'text' | 'variable';
  content: string; // For text segments, this is the actual text. For variables, this is the variable ID
}

export interface MadLibPayload {
  segments: MadLibSegment[];
  variables: MadLibVariable[];
}

// ===== ENTITY TYPES =====

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ExperienceParticipant {
  id: string;
  user_id: string;
  experience_id: string;
  name: string;
  email: string;
  status: ParticipantStatus;
  role: ParticipantRole;
  joined_at: string | null;
  fingerprint: string | null;
  created_at: string;
  updated_at: string;
}

// Discriminated union for blocks
interface BaseBlock {
  id: string;
  status: BlockStatus;
  visible_to_roles?: ParticipantRole[];
  visible_to_segments?: string[];
  target_user_ids?: string[];
  created_at?: string;
  updated_at?: string;
  responses?: {
    total: number;
    user_responded: boolean;
    user_response?: {
      id: string;
      answer: any;
    } | null;
    aggregate?: Record<string, any>;
    all_responses?: Record<string, string>;
  };
}

export interface PollBlock extends BaseBlock {
  kind: BlockKind.POLL;
  payload: PollPayload;
}

export interface QuestionBlock extends BaseBlock {
  kind: BlockKind.QUESTION;
  payload: QuestionPayload;
}

export interface MultistepFormBlock extends BaseBlock {
  kind: BlockKind.MULTISTEP_FORM;
  payload: MultistepFormPayload;
}

export interface AnnouncementBlock extends BaseBlock {
  kind: BlockKind.ANNOUNCEMENT;
  payload: AnnouncementPayload;
}

export interface MadLibBlock extends BaseBlock {
  kind: BlockKind.MAD_LIB;
  payload: MadLibPayload;
}

export type Block =
  | PollBlock
  | QuestionBlock
  | MultistepFormBlock
  | AnnouncementBlock
  | MadLibBlock;

export interface Experience {
  id: string;
  name: string;
  code: string;
  status: ExperienceStatus;
  creator_id: string;
  hosts: ExperienceParticipant[];
  participants: ExperienceParticipant[];
  blocks: Block[];
  created_at: string;
  updated_at: string;
}

// ===== TYPE FRAGMENTS (using Pick/Omit from complete types) =====

export type UserSummary = Pick<User, 'id' | 'name' | 'email'>;

export type ParticipantSummary = Pick<
  ExperienceParticipant,
  'id' | 'user_id' | 'name' | 'email' | 'role'
>;

// ===== API REQUEST TYPES =====

export interface CreateExperienceRequest {
  experience: {
    name: string;
    code: string;
  };
}

export interface JoinExperienceRequest {
  code: string;
}

export interface RegisterExperienceRequest {
  code: string;
  email: string;
  name?: string;
}

export interface CreateExperienceBlockRequest {
  experience: {
    kind: BlockKind;
    payload?:
      | PollPayload
      | QuestionPayload
      | MultistepFormPayload
      | AnnouncementPayload
      | MadLibPayload;
    visible_to_roles?: ParticipantRole[];
    visible_to_segments?: string[];
    target_user_ids?: string[];
    status?: BlockStatus;
    open_immediately?: boolean;
  };
}

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateExperienceSuccessResponse {
  type: 'success';
  success: true;
  experience: {
    id: string;
    code: string;
    created_at: string;
    url: string;
  };
}

export interface CreateExperienceErrorResponse {
  type: 'error';
  success: false;
  message: string;
  error: string;
}

export type CreateExperienceApiResponse =
  | CreateExperienceSuccessResponse
  | CreateExperienceErrorResponse;

export interface GetExperienceSuccessResponse {
  type: 'success';
  success: true;
  experience: Experience;
  participant: ParticipantSummary | null;
}

export interface GetExperienceErrorResponse {
  type: 'error';
  error: string;
}

export type GetExperienceApiResponse = GetExperienceSuccessResponse | GetExperienceErrorResponse;

export interface JoinExperienceRegisteredResponse {
  type: 'success';
  url: string;
  status: 'registered';
}

export interface JoinExperienceNeedsRegistrationResponse {
  type: 'needs_registration';
  experience_code: string;
  status: 'needs_registration';
  url: string;
}

export interface JoinExperienceErrorResponse {
  type: 'error';
  error: string;
}

export type JoinExperienceApiResponse =
  | JoinExperienceRegisteredResponse
  | JoinExperienceNeedsRegistrationResponse
  | JoinExperienceErrorResponse;

export interface RegisterExperienceSuccessResponse {
  type: 'success';
  jwt: string;
  url: string;
  status: 'registered';
}

export interface RegisterExperienceErrorResponse {
  type: 'error';
  error: string;
}

export type RegisterExperienceApiResponse =
  | RegisterExperienceSuccessResponse
  | RegisterExperienceErrorResponse;

export type ExperienceOrchestrationResponse = ApiResponse<Experience>;

export type GetCurrentUserResponse = User;

// ===== AUTHENTICATION TYPES =====

export interface PasswordlessSignInRequest {
  passwordless: {
    email: string;
  };
}

export interface PasswordlessSignInResponse {
  // Typically returns HTML page or redirect
  // Success is indicated by redirect to intended page
}

export interface AuthenticationErrorResponse {
  error: string;
  message?: string;
}

export interface ExperienceJwtPayload {
  user_id: string;
  experience_id: string;
  exp: number;
  scope?: string;
}

// ===== ERROR TYPES =====

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, any>;
}

// ===== WEBSOCKET MESSAGE TYPES =====

export const WebSocketMessageTypes = {
  EXPERIENCE_STATE: 'experience_state',
  EXPERIENCE_UPDATED: 'experience_updated',
  STREAM_CHANGED: 'stream_changed',
  RESUBSCRIBE_REQUIRED: 'resubscribe_required',
  CONFIRM_SUBSCRIPTION: 'confirm_subscription',
  PING: 'ping',
} as const;

export type WebSocketMessageType =
  (typeof WebSocketMessageTypes)[keyof typeof WebSocketMessageTypes];

export type StreamType = 'role' | 'role_segments' | 'targeted';

export interface WebSocketMessageMetadata {
  participant_id: string;
  timestamp: number;
}

export interface ExperienceStateMessageMetadata extends WebSocketMessageMetadata {
  logical_stream: string;
}

export interface ExperienceUpdatedMessageMetadata extends WebSocketMessageMetadata {
  stream_key: string;
  stream_type: StreamType;
  role: ParticipantRole;
  segments: string[];
}

export interface StreamChangedMessageMetadata extends WebSocketMessageMetadata {
  old_stream: string;
  new_stream: string;
}

export interface ResubscribeRequiredMessageMetadata {
  participant_id: string;
  timestamp: number;
  reason: string;
}

// Base WebSocket message structure
export interface BaseWebSocketMessage<
  T extends WebSocketMessageType,
  M = WebSocketMessageMetadata,
> {
  type: T;
  metadata?: M;
}

// Experience-related messages that include experience data
export interface ExperienceWebSocketMessage<
  T extends WebSocketMessageType,
  M = WebSocketMessageMetadata,
> extends BaseWebSocketMessage<T, M> {
  experience: Experience;
}

// Specific message types
export interface ExperienceStateMessage
  extends ExperienceWebSocketMessage<'experience_state', ExperienceStateMessageMetadata> {}

export interface ExperienceUpdatedMessage
  extends ExperienceWebSocketMessage<'experience_updated', ExperienceUpdatedMessageMetadata> {}

export interface StreamChangedMessage
  extends ExperienceWebSocketMessage<'stream_changed', StreamChangedMessageMetadata> {}

export interface ResubscribeRequiredMessage
  extends BaseWebSocketMessage<'resubscribe_required', ResubscribeRequiredMessageMetadata> {
  reason: string;
}

export interface ConfirmSubscriptionMessage extends BaseWebSocketMessage<'confirm_subscription'> {}

export interface PingMessage extends BaseWebSocketMessage<'ping'> {}

// Union type for all possible WebSocket messages
export type WebSocketMessage =
  | ExperienceStateMessage
  | ExperienceUpdatedMessage
  | StreamChangedMessage
  | ResubscribeRequiredMessage
  | ConfirmSubscriptionMessage
  | PingMessage;

// ===== CREATE EXPERIENCE FORM TYPES =====

// Base data types for each block type (form state)
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

export interface CreateBlockContextValue {
  kind: Block['kind'];
  setKind: (kind: Block['kind']) => void;

  // Block data
  data: BlockData;
  setData: (data: BlockData | ((prev: BlockData) => BlockData)) => void;

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

// ===== CONTEXT TYPES =====

export interface ExperienceContextType {
  experience?: Experience;
  participant?: ParticipantSummary;
  code: string;
  jwt?: string;

  isAuthenticated: boolean;
  isLoading: boolean;
  isPolling: boolean;
  experienceStatus: 'lobby' | 'live';
  error?: string;

  setJWT: (token: string) => void;
  clearJWT: () => void;
  experienceFetch: (url: string, options?: RequestInit) => Promise<Response>;
  refetchExperience: () => Promise<void>;

  // WebSocket properties
  wsConnected: boolean;
  wsError?: string;
}
