import type { FamilyFeudAction } from '@cctv/pages/Block/FamilyFeudManager/familyFeudReducer';

// ===== CORE DOMAIN TYPES =====

export interface AuthError extends Error {
  code?: number;
}

export type UserRole = 'user' | 'admin' | 'superadmin';
export type ExperienceStatus = 'draft' | 'lobby' | 'live' | 'paused' | 'finished' | 'archived';
export type ParticipantRole = 'audience' | 'player' | 'moderator' | 'host';
export type ParticipantStatus = 'registered' | 'active';
export type BlockStatus = 'hidden' | 'open' | 'closed';
export enum BlockKind {
  POLL = 'poll',
  QUESTION = 'question',
  ANNOUNCEMENT = 'announcement',
  MAD_LIB = 'mad_lib',
  FAMILY_FEUD = 'family_feud',
  PHOTO_UPLOAD = 'photo_upload',
  BUZZER = 'buzzer',
}

export interface ExperienceSegment {
  id: string;
  name: string;
  color: string;
  position: number;
}

// ===== BLOCK PAYLOAD TYPES =====

export interface PollPayload {
  question: string;
  options: string[];
  pollType?: 'single' | 'multiple';
  segmentAssignments?: Record<string, string>;
}

export interface QuestionPayload {
  question: string;
  formKey: string;
  inputType?: 'text' | 'number' | 'email' | 'password' | 'tel';
}

export interface AnnouncementPayload {
  message: string;
  show_on_monitor?: boolean;
}

export interface FamilyFeudBucket {
  bucket_id: string;
  bucket_name: string;
  percentage: number;
  revealed: boolean;
}

export interface FamilyFeudQuestion {
  question_id: string;
  question_text: string;
  buckets: FamilyFeudBucket[];
}

export interface FamilyFeudGameState {
  phase: 'gathering' | 'playing';
  current_question_index: number;
  questions: FamilyFeudQuestion[];
  show_x: boolean;
}

export interface FamilyFeudPayload {
  title: string;
  bucket_configuration?: {
    buckets: Array<{
      id: string;
      name: string;
      answer_ids: string[];
    }>;
  };
  game_state?: FamilyFeudGameState;
}

export interface PhotoUploadPayload {
  prompt: string;
}

export interface BuzzerPayload {
  label?: string;
  prompt?: string;
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
  assigned_participant_id?: string;
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
  segmentAssignments?: Record<string, string>;
}

export interface QuestionApiPayload {
  type: 'question';
  question: string;
  formKey: string;
  inputType: 'text' | 'number' | 'email' | 'password' | 'tel';
}

export interface AnnouncementApiPayload {
  type: 'announcement';
  message: string;
  show_on_monitor: boolean;
}

export interface MadLibApiPayload {
  type: 'mad_lib';
  parts: MadLibPart[];
}

export interface FamilyFeudApiPayload {
  type: 'family_feud';
  title: string;
}

export interface PhotoUploadApiPayload {
  type: 'photo_upload';
  prompt: string;
}

export interface BuzzerApiPayload {
  type: 'buzzer';
  label?: string;
  prompt?: string;
}

// Discriminated union for API payloads (what gets sent to backend)
export type ApiPayload =
  | PollApiPayload
  | QuestionApiPayload
  | AnnouncementApiPayload
  | MadLibApiPayload
  | FamilyFeudApiPayload
  | PhotoUploadApiPayload
  | BuzzerApiPayload;

// ===== PLAYBILL TYPES =====

export interface PlaybillSection {
  id: string;
  title: string;
  body: string;
  image_signed_id?: string;
  image_url?: string;
}

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

export interface AvatarStroke {
  points: number[];
  color: string;
  width: number;
  committed?: boolean;
}

export interface ExperienceParticipant {
  id: string;
  user_id: string;
  experience_id: string;
  name: string;
  email: string;
  status: ParticipantStatus;
  role: ParticipantRole;
  segments?: string[];
  joined_at: string | null;
  fingerprint: string | null;
  created_at: string;
  updated_at: string;
  avatar?: {
    strokes?: AvatarStroke[];
    updated_at?: string;
  } | null;
}

export interface BlockResponse {
  id: string;
  user_id: string;
  answer: any;
  created_at: string;
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
    user_responded?: boolean;
    user_response?: {
      id: string;
      answer: any;
    } | null;
    aggregate?: Record<string, any>;
    all_responses?: BlockResponse[];
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

export interface PhotoUploadBlock extends BaseBlock {
  kind: BlockKind.PHOTO_UPLOAD;
  payload: PhotoUploadPayload;
  responses?: {
    total: number;
    user_responded: boolean;
    user_response?: {
      id: string;
      answer: Record<string, unknown>;
      photo_url?: string;
    } | null;
    all_responses?: Array<{
      id: string;
      user_id: string;
      answer: Record<string, unknown>;
      photo_url?: string;
      created_at: string;
    }>;
  };
}

export interface BuzzerBlock extends BaseBlock {
  kind: BlockKind.BUZZER;
  payload: BuzzerPayload;
  responses?: {
    total: number;
    user_responded: boolean;
    user_response?: { id: string; answer: { buzzed_at: string } } | null;
    all_responses?: Array<{
      id: string;
      user_id: string;
      answer: { buzzed_at: string };
      created_at: string;
      avatar?: { strokes?: AvatarStroke[] } | null;
    }>;
  };
}

export type Block =
  | PollBlock
  | QuestionBlock
  | AnnouncementBlock
  | MadLibBlock
  | FamilyFeudBlock
  | PhotoUploadBlock
  | BuzzerBlock;

export interface Experience {
  id: string;
  name: string;
  code: string;
  code_slug: string;
  url: string;
  status: ExperienceStatus;
  description?: string;
  creator_id: string;
  hosts: ExperienceParticipant[];
  participants: ExperienceParticipant[];
  blocks: Block[];
  playbill_enabled?: boolean;
  playbill?: PlaybillSection[];
  segments?: ExperienceSegment[];
  created_at: string;
  updated_at: string;
  participant_block_active?: boolean;
  responded_participant_ids?: string[];
}

// ===== TYPE FRAGMENTS (using Pick/Omit from complete types) =====

export type UserSummary = Pick<User, 'id' | 'name' | 'email'>;

export type ParticipantSummary = Pick<
  ExperienceParticipant,
  'id' | 'user_id' | 'name' | 'email' | 'role' | 'avatar' | 'segments'
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
    | AnnouncementPayload
    | MadLibPayload
    | FamilyFeudPayload
    | PhotoUploadPayload
    | BuzzerPayload;
  visible_to_segment_ids?: string[];
  status?: BlockStatus;
  open_immediately?: boolean;
  variables?: Array<{
    key: string;
    label: string;
    datatype: string;
    required: boolean;
    source?:
      | { type: string; participant_id: string }
      | { kind: string; question: string; input_type: string };
  }>;
  questions?: Array<{
    payload: Record<string, string>;
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
  FAMILY_FEUD_UPDATED: 'family_feud_updated',
  SUBMISSION_STATE: 'submission_state',
} as const;

export type WebSocketMessageType =
  (typeof WebSocketMessageTypes)[keyof typeof WebSocketMessageTypes];

export type FamilyFeudDispatchPayload = FamilyFeudAction['payload'];

export interface FamilyFeudUpdatedMessageMetadata extends WebSocketMessageMetadata {
  block_id: string;
  operation: string;
  data: FamilyFeudDispatchPayload;
}

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

export interface FamilyFeudUpdatedMessage
  extends BaseWebSocketMessage<'family_feud_updated', FamilyFeudUpdatedMessageMetadata> {
  block_id: string;
  operation: string;
  data: FamilyFeudDispatchPayload;
}

export type SubmissionState = Record<string, { id: string; answer: Record<string, unknown> }>;

export interface SubmissionStateMessage {
  type: 'submission_state';
  submissions: SubmissionState;
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
  | PingMessage
  | FamilyFeudUpdatedMessage
  | SubmissionStateMessage;

export interface DrawingUpdateMessage {
  type: 'drawing_update';
  participant_id: string;
  operation: string;
  data?: unknown;
}

export type ExperiencePayloadMessage =
  | ExperienceStateMessage
  | ExperienceUpdatedMessage
  | StreamChangedMessage;

export type ExperienceChannelMessage = WebSocketMessage | DrawingUpdateMessage;

export function isExperiencePayloadMessage(msg: WebSocketMessage): msg is ExperiencePayloadMessage {
  return (
    msg.type === WebSocketMessageTypes.EXPERIENCE_STATE ||
    msg.type === WebSocketMessageTypes.EXPERIENCE_UPDATED ||
    msg.type === WebSocketMessageTypes.STREAM_CHANGED
  );
}

export function isDrawingUpdateMessage(msg: ExperienceChannelMessage): msg is DrawingUpdateMessage {
  return msg.type === 'drawing_update';
}

// ===== CREATE EXPERIENCE FORM TYPES =====

// Base data types for each block type (form state)
export interface PollData {
  question: string;
  options: string[];
  pollType: 'single' | 'multiple';
  segmentAssignments: Record<string, string>;
}

export interface QuestionData {
  questionText: string;
  questionFormKey: string;
  questionInputType: 'text' | 'number' | 'email' | 'password' | 'tel';
}

export interface AnnouncementData {
  message: string;
  show_on_monitor: boolean;
}

export interface MadLibData {
  parts: MadLibPart[];
  variables: MadLibVariable[];
}

export interface FamilyFeudData {
  title: string;
  questions: Array<{ id: string; question: string }>;
}

export interface PhotoUploadData {
  prompt: string;
}

export interface BuzzerData {
  label: string;
  prompt: string;
}

// Union type for all block component data
export type BlockComponentData =
  | PollData
  | QuestionData
  | AnnouncementData
  | MadLibData
  | FamilyFeudData
  | PhotoUploadData
  | BuzzerData;

// Discriminated union for form block data
export type FormBlockData =
  | { kind: BlockKind.POLL; data: PollData }
  | { kind: BlockKind.QUESTION; data: QuestionData }
  | { kind: BlockKind.ANNOUNCEMENT; data: AnnouncementData }
  | { kind: BlockKind.MAD_LIB; data: MadLibData }
  | { kind: BlockKind.FAMILY_FEUD; data: FamilyFeudData }
  | { kind: BlockKind.PHOTO_UPLOAD; data: PhotoUploadData }
  | { kind: BlockKind.BUZZER; data: BuzzerData };

export interface UpdateBlockPayload {
  payload: ApiPayload | Record<string, unknown>;
  visible_to_segment_ids: string[];
  variables?: Array<{
    key: string;
    label: string;
    datatype: string;
    required: boolean;
  }>;
  questions?: Array<{ id: string; question: string }>;
}

export interface EditBlockContextValue {
  blockData: FormBlockData;
  setBlockData: (data: FormBlockData | ((prev: FormBlockData) => FormBlockData)) => void;
  participants: ParticipantSummary[];
  submit: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  visibleSegments: string[];
  setVisibleSegments: (segments: string[]) => void;
  viewAdditionalDetails: boolean;
  setViewAdditionalDetails: (view: boolean) => void;
  showOnMonitor: boolean;
  setShowOnMonitor: (value: boolean) => void;
  pendingWarning: string | null;
  confirmWarning: () => void;
  cancelWarning: () => void;
}

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
  visibleSegments: string[];
  setVisibleSegments: (segments: string[]) => void;
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

  setParticipantJWT: (token: string) => void;
  clearAuth: () => void;
  experienceFetch: (url: string, options?: RequestInit) => Promise<Response>;

  wsConnected: boolean;
  wsReady: boolean;
  wsError?: string;

  // Manage page specific properties
  monitorView?: Experience;
  participantView?: Experience;
  impersonatedParticipantId?: string;
  setImpersonatedParticipantId: (id: string | undefined) => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerFamilyFeudDispatch?: (blockId: string, dispatch: (action: any) => void) => void;
  unregisterFamilyFeudDispatch?: (blockId: string) => void;

  experiencePerform?: (
    action: string,
    payload?: Record<string, unknown>,
    target?: 'primary' | 'monitor' | 'impersonation',
  ) => void;
}
