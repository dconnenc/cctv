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
  GUESS_WHO = 'guess_who',
  MINIGAME_ARITHMETIC = 'minigame_arithmetic',
  MINIGAME_BALLOON_PUMP = 'minigame_balloon_pump',
  THE_SCENE = 'the_scene',
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

export interface GuessWhoSlide {
  slot: 'a' | 'b';
  block_id: string;
  block_kind: BlockKind;
  prompt: string;
  answer: { text?: string | null; raw?: unknown; options?: string[]; buzzed_at?: string | null };
  photo_url: string | null;
  position: number;
  submitted_at: string;
  user_id?: string;
}

export interface GuessWhoUserSummary {
  user_id: string;
  name: string;
  avatar?: { strokes?: AvatarStroke[] } | null;
}

export interface GuessWhoPayload {
  segment_id: string;
  user_a_id?: string;
  user_b_id?: string;
  user_a?: GuessWhoUserSummary | null;
  user_b?: GuessWhoUserSummary | null;
  slides?: GuessWhoSlide[];
  current_slide_index?: number;
  revealed?: boolean;
  error?: string;
}

export interface MinigameArithmeticQuestion {
  index: number;
  lhs: number;
  op: '+' | '-' | '*' | '/';
  rhs: number;
  answer: number;
  prompt: string;
}

export interface MinigameArithmeticCurrentQuestion {
  index: number;
  prompt: string;
}

export interface MinigameArithmeticLeaderboardEntry {
  participant_id: string;
  user_id: string;
  name: string;
  avatar?: { strokes?: AvatarStroke[] } | null;
  correct: number;
  completed: number;
  rank: number;
}

export interface MinigameArithmeticPayload {
  variant: 'arithmetic';
  duration_seconds: number;
  question_count: number;
  leaderboard_size: number;
  started_at: string | null;
  ended_at: string | null;
  questions?: MinigameArithmeticQuestion[];
  current_question?: MinigameArithmeticCurrentQuestion | null;
  score?: { correct: number; completed: number };
  leaderboard?: MinigameArithmeticLeaderboardEntry[];
  submission_count?: number;
}

export interface MinigameBalloonPumpPodiumEntry {
  place: 1 | 2 | 3;
  participant_id: string;
  name: string;
  avatar?: { strokes?: AvatarStroke[] } | null;
  fill_amount: number;
}

export interface MinigameBalloonPumpLiveResult {
  participant_id: string;
  name: string;
  fill_amount: number;
}

export type TheScenePhase = 'idle' | 'collecting' | 'voting' | 'ended';

export interface TheSceneSuggestion {
  id: string;
  text: string;
  user_id: string;
  vote_count: number;
  rank: number;
}

export interface TheScenePayload {
  phase: TheScenePhase;
  scene_started_at: string | null;
  leaderboard_size: number;
  leaderboard: TheSceneSuggestion[];
  own_suggestion?: { id: string; text: string } | null;
  own_vote_suggestion_id?: string | null;
  votable_suggestions?: TheSceneSuggestion[];
  all_suggestions?: TheSceneSuggestion[];
}

export interface MinigameBalloonPumpPayload {
  variant: 'balloon_pump';
  target_units: number;
  started_at: string | null;
  ended_at: string | null;
  leader_fill: number;
  leader_participant_id: string | null;
  winner_participant_ids: string[];
  own_fill?: number;
  podium?: MinigameBalloonPumpPodiumEntry[];
  live_results?: MinigameBalloonPumpLiveResult[];
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

export interface GuessWhoApiPayload {
  type: 'guess_who';
  segment_id: string;
}

export interface MinigameArithmeticApiPayload {
  type: 'minigame_arithmetic';
  variant: 'arithmetic';
  duration_seconds: number;
  question_count: number;
  leaderboard_size: number;
}

export interface TheSceneApiPayload {
  type: 'the_scene';
  leaderboard_size: number;
}

export interface MinigameBalloonPumpApiPayload {
  type: 'minigame_balloon_pump';
  variant: 'balloon_pump';
  target_units: number;
}

// Discriminated union for API payloads (what gets sent to backend)
export type ApiPayload =
  | PollApiPayload
  | QuestionApiPayload
  | AnnouncementApiPayload
  | MadLibApiPayload
  | FamilyFeudApiPayload
  | PhotoUploadApiPayload
  | BuzzerApiPayload
  | GuessWhoApiPayload
  | MinigameArithmeticApiPayload
  | MinigameBalloonPumpApiPayload
  | TheSceneApiPayload;

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
  performer_slug?: string | null;
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
    user_responded?: boolean;
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
    user_responded?: boolean;
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

export interface GuessWhoBlock extends BaseBlock {
  kind: BlockKind.GUESS_WHO;
  payload: GuessWhoPayload;
}

export interface MinigameArithmeticBlock extends BaseBlock {
  kind: BlockKind.MINIGAME_ARITHMETIC;
  payload: MinigameArithmeticPayload;
  responses?: {
    total: number;
    correct_count?: number;
    participant_counts?: Record<string, number>;
  };
}

export interface MinigameBalloonPumpBlock extends BaseBlock {
  kind: BlockKind.MINIGAME_BALLOON_PUMP;
  payload: MinigameBalloonPumpPayload;
  responses?: {
    total: number;
  };
}

export interface TheSceneBlock extends BaseBlock {
  kind: BlockKind.THE_SCENE;
  payload: TheScenePayload;
  responses?: {
    total: number;
    vote_count?: number;
  };
}

export type Block =
  | PollBlock
  | QuestionBlock
  | AnnouncementBlock
  | MadLibBlock
  | FamilyFeudBlock
  | PhotoUploadBlock
  | BuzzerBlock
  | GuessWhoBlock
  | MinigameArithmeticBlock
  | MinigameBalloonPumpBlock
  | TheSceneBlock;

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
  default_segment_id?: string | null;
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
    | BuzzerPayload
    | GuessWhoPayload
    | MinigameArithmeticPayload
    | MinigameBalloonPumpPayload
    | TheScenePayload;
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
  experience_name: string;
  experience_code_slug: string;
}

export interface JoinExperienceNeedsRegistrationResponse {
  type: 'needs_registration';
  experience_code: string;
  status: 'needs_registration';
  url: string;
  experience_name: string;
  experience_code_slug: string;
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
  BALLOON_PUMP_LEADER_UPDATED: 'balloon_pump_leader_updated',
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

export interface BalloonPumpLeaderUpdatedMessage {
  type: 'balloon_pump_leader_updated';
  block_id: string;
  leader_fill: number;
  target_units: number;
  leader_participant_id: string | null;
  timestamp: number;
}

export type SubmissionState = Record<
  string,
  { id: string; answer: Record<string, unknown>; photo_url?: string }
>;

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
  | BalloonPumpLeaderUpdatedMessage
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

// ===== EVENT & PERFORMER TYPES =====

export interface Performer {
  id: string;
  name: string;
  bio: string | null;
  slug: string;
  photo_url: string | null;
  follower_count: number;
  followed_by_current_user: boolean;
  editable_by_current_user: boolean;
  upcoming_events?: EventSummary[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  venue_name: string | null;
  venue_address: string | null;
  pricing_text: string | null;
  ticket_url: string | null;
  slug: string;
  published: boolean;
  performers: Pick<Performer, 'id' | 'name' | 'slug' | 'photo_url' | 'followed_by_current_user'>[];
  experience: {
    code_slug: string;
    status: ExperienceStatus;
    active: boolean;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export type EventSummary = Pick<
  CalendarEvent,
  'id' | 'title' | 'starts_at' | 'ends_at' | 'slug' | 'venue_name'
>;

export interface EventsApiResponse {
  type: 'success';
  success: true;
  events: CalendarEvent[];
}

export interface EventApiResponse {
  type: 'success';
  success: true;
  event: CalendarEvent;
}

export interface PerformersApiResponse {
  type: 'success';
  success: true;
  performers: Performer[];
}

export interface PerformerApiResponse {
  type: 'success';
  success: true;
  performer: Performer;
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

export interface GuessWhoData {
  segment_id: string;
}

export interface MinigameArithmeticData {
  duration_seconds: number;
  question_count: number;
  leaderboard_size: number;
}

export interface MinigameBalloonPumpData {
  target_units: number;
}

export interface TheSceneData {
  leaderboard_size: number;
}

// Union type for all block component data
export type BlockComponentData =
  | PollData
  | QuestionData
  | AnnouncementData
  | MadLibData
  | FamilyFeudData
  | PhotoUploadData
  | BuzzerData
  | GuessWhoData
  | MinigameArithmeticData
  | MinigameBalloonPumpData
  | TheSceneData;

// Discriminated union for form block data
export type FormBlockData =
  | { kind: BlockKind.POLL; data: PollData }
  | { kind: BlockKind.QUESTION; data: QuestionData }
  | { kind: BlockKind.ANNOUNCEMENT; data: AnnouncementData }
  | { kind: BlockKind.MAD_LIB; data: MadLibData }
  | { kind: BlockKind.FAMILY_FEUD; data: FamilyFeudData }
  | { kind: BlockKind.PHOTO_UPLOAD; data: PhotoUploadData }
  | { kind: BlockKind.BUZZER; data: BuzzerData }
  | { kind: BlockKind.GUESS_WHO; data: GuessWhoData }
  | { kind: BlockKind.MINIGAME_ARITHMETIC; data: MinigameArithmeticData }
  | { kind: BlockKind.MINIGAME_BALLOON_PUMP; data: MinigameBalloonPumpData }
  | { kind: BlockKind.THE_SCENE; data: TheSceneData };

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

  // Visibility — segments default to the experience's default segment.
  visibleSegments: string[];
  setVisibleSegments: (segments: string[]) => void;
  defaultSegmentName: string | null;
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
