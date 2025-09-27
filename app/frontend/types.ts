// ===== CORE DOMAIN TYPES =====

export type UserRole = 'user' | 'admin' | 'superadmin';
export type ExperienceStatus = 'draft' | 'lobby' | 'live' | 'paused' | 'finished' | 'archived';
export type ParticipantRole = 'audience' | 'player' | 'moderator' | 'host';
export type ParticipantStatus = 'registered' | 'active';
export type BlockStatus = 'hidden' | 'open' | 'closed';
export type BlockKind = 'poll' | 'question' | 'multistep_form' | 'announcement';

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
    aggregate?: Record<string, number>;
  };
}

export interface PollBlock extends BaseBlock {
  kind: 'poll';
  payload: PollPayload;
}

export interface QuestionBlock extends BaseBlock {
  kind: 'question';
  payload: QuestionPayload;
}

export interface MultistepFormBlock extends BaseBlock {
  kind: 'multistep_form';
  payload: MultistepFormPayload;
}

export interface AnnouncementBlock extends BaseBlock {
  kind: 'announcement';
  payload: AnnouncementPayload;
}

export type Block = PollBlock | QuestionBlock | MultistepFormBlock | AnnouncementBlock;

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
    payload?: PollPayload | QuestionPayload | MultistepFormPayload | AnnouncementPayload;
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

// ===== CONTEXT TYPES =====

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

  // WebSocket properties
  wsConnected: boolean;
  wsError?: string;
}
