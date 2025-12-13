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
  FAMILY_FEUD = 'family_feud',
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

export interface FamilyFeudPayload {
  title: string;
}

export interface BlockLink {
  id: string;
  parent_block_id: string;
  child_block_id: string;
  relationship: 'depends_on';
  position: number;
}

export interface BlockVariable {
  id: string;
  key: string;
  label: string;
  datatype: 'string' | 'number' | 'text';
  required: boolean;
}

export interface BlockVariableBinding {
  id: string;
  variable_id: string;
  source_block_id: string;
}

export interface MadLibVariable {
  id: string;
  name: string;
  question: string;
  dataType: 'text' | 'number';
  assigned_user_id?: string;
}

export interface MadLibPart {
  id: string;
  type: 'text' | 'variable';
  content: string;
}

export interface MadLibSegment {
  id: string;
  type: 'text' | 'variable';
  content: string;
}

export interface MadLibPayload {
  parts: MadLibPart[];
}

// Individual API payload types for builder functions
export interface PollApiPayload {
  type: 'poll';
  question: string;
  options: string[];
  pollType: 'single' | 'multiple';
}

export interface QuestionApiPayload {
  type: 'question';
  question: string;
  formKey: string;
  inputType: 'text' | 'number' | 'email' | 'password' | 'tel';
}

export interface MultistepFormApiPayload {
  type: 'multistep_form';
  questions: Array<{ type: 'question'; question: string; formKey: string; inputType: string }>;
}

export interface AnnouncementApiPayload {
  type: 'announcement';
  message: string;
}

export interface MadLibApiPayload {
  type: 'mad_lib';
  parts: MadLibPart[];
}

export interface FamilyFeudApiPayload {
  type: 'family_feud';
  title: string;
}

// Discriminated union for API payloads (what gets sent to backend)
export type ApiPayload =
  | PollApiPayload
  | QuestionApiPayload
  | MultistepFormApiPayload
  | AnnouncementApiPayload
  | MadLibApiPayload
  | FamilyFeudApiPayload;

// ===== ENTITY TYPES =====

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  most_recent_participant_name?: string;
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
  position: number;
  parent_block_id?: string | null;
  visible_to_roles?: ParticipantRole[];
  visible_to_segments?: string[];
  target_user_ids?: string[];
  show_in_lobby?: boolean;
  created_at?: string;
  updated_at?: string;
  child_block_ids?: string[];
  parent_block_ids?: string[];
  children?: Block[];
  responses?: {
    total: number;
    user_responded: boolean;
    user_response?: {
      id: string;
      answer: any;
    } | null;
    aggregate?: Record<string, any>;
    all_responses?: Array<{
      id: string;
      user_id: string;
      answer: any;
      created_at: string;
    }>;
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
  variables?: BlockVariable[];
  variable_bindings?: BlockVariableBinding[];
  responses?: {
    total: number;
    user_responded: boolean;
    user_response: null;
    resolved_variables?: Record<string, string>;
  };
}

export interface FamilyFeudBlock extends BaseBlock {
  kind: BlockKind.FAMILY_FEUD;
  payload: FamilyFeudPayload;
}

export type Block =
  | PollBlock
  | QuestionBlock
  | MultistepFormBlock
  | AnnouncementBlock
  | MadLibBlock
  | FamilyFeudBlock;

export interface Experience {
  id: string;
  name: string;
  code: string;
  status: ExperienceStatus;
  description?: string;
  creator_id: string;
  hosts: ExperienceParticipant[];
  participants: ExperienceParticipant[];
  blocks: Block[];
  next_block?: Block | null;
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
  email: string;
  name?: string;
  participant_name: string;
}

export interface CreateBlockPayload {
  kind: BlockKind;
  payload?:
    | PollPayload
    | QuestionPayload
    | MultistepFormPayload
    | AnnouncementPayload
    | MadLibPayload
    | FamilyFeudPayload;
  visible_to_roles?: ParticipantRole[];
  visible_to_segments?: string[];
  target_user_ids?: string[];
  status?: BlockStatus;
  open_immediately?: boolean;
  variables?: Array<{
    key: string;
    label: string;
    datatype: 'string' | 'number' | 'text';
    required: boolean;
    source:
      | { type: 'participant'; participant_id: string }
      | { kind: 'question'; question: string; input_type: string };
  }>;
  questions?: Array<{
    payload: {
      question: string;
    };
  }>;
}

export interface CreateExperienceBlockRequest {
  block: CreateBlockPayload;
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
  participant?: ParticipantSummary;
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
  parts: MadLibPart[];
  variables: MadLibVariable[];
}

export interface FamilyFeudData {
  title: string;
  questions: Array<{ id: string; question: string }>;
}

// Union type for all block component data
export type BlockComponentData =
  | PollData
  | QuestionData
  | MultistepFormData
  | AnnouncementData
  | MadLibData
  | FamilyFeudData;

// Discriminated union for form block data
export type FormBlockData =
  | { kind: BlockKind.POLL; data: PollData }
  | { kind: BlockKind.QUESTION; data: QuestionData }
  | { kind: BlockKind.MULTISTEP_FORM; data: MultistepFormData }
  | { kind: BlockKind.ANNOUNCEMENT; data: AnnouncementData }
  | { kind: BlockKind.MAD_LIB; data: MadLibData }
  | { kind: BlockKind.FAMILY_FEUD; data: FamilyFeudData };

export interface CreateBlockContextValue {
  // Form block data with discriminated union
  blockData: FormBlockData;
  setBlockData: (data: FormBlockData | ((prev: FormBlockData) => FormBlockData)) => void;
  setKind: (kind: BlockKind) => void;

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
  showInLobby: boolean;
  setShowInLobby: (show: boolean) => void;
  viewAdditionalDetails: boolean;
  setViewAdditionalDetails: (view: boolean) => void;
}

// Props interface for block components
export interface BlockComponentProps<T = BlockComponentData> {
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
  experienceStatus: 'lobby' | 'live';
  error?: string;

  setJWT: (token: string) => void;
  clearJWT: () => void;
  experienceFetch: (url: string, options?: RequestInit) => Promise<Response>;

  wsConnected: boolean;
  wsError?: string;

  // Manage page specific properties
  monitorView?: Experience;
  participantView?: Experience;
  impersonatedParticipantId?: string;
  setImpersonatedParticipantId: (id: string | undefined) => void;

  // Family Feud block-scoped dispatch registration
  registerFamilyFeudDispatch?: (blockId: string, dispatch: (action: any) => void) => void;
  unregisterFamilyFeudDispatch?: (blockId: string) => void;
}
