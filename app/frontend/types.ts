// ===== FRONTEND-SPECIFIC TYPES =====

export interface PollExperience {
  type: 'poll';
  question: string;
  options: string[];
  pollType: 'single' | 'multiple';
}

export interface QuestionExperience {
  type: 'question';
  question: string;
  formKey: string;
  inputType?: 'text' | 'number' | 'email' | 'password' | 'tel';
}

export interface MultistepFormExperience {
  type: 'multistep_form';
  questions: QuestionExperience[];
}

export type Experience = PollExperience | QuestionExperience | MultistepFormExperience;

// ===== GENERATED CODE =====

// ===== CORE TYPES =====

// User Role Types
export type UserRole = 'user' | 'admin' | 'superadmin';

// Experience Status Types
export type ExperienceStatus = 'draft' | 'lobby' | 'live' | 'paused' | 'finished' | 'archived';

// Participant Role Types
export type ParticipantRole = 'audience' | 'player' | 'moderator' | 'host';

// Participant Status Types
export type ParticipantStatus = 'registered' | 'active';

// ===== USER TYPES =====

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ParticipantWithRole {
  id: string;
  name: string;
  email: string;
  role: ParticipantRole;
}

// ===== EXPERIENCE TYPES =====

export interface ExperienceModel {
  id: string;
  name: string;
  code: string;
  status: ExperienceStatus;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface ExperienceParticipant {
  id: string;
  user_id: string;
  experience_id: string;
  status: ParticipantStatus;
  role: ParticipantRole;
  joined_at: string | null;
  fingerprint: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperienceWithParticipants {
  id: string;
  code: string;
  status: ExperienceStatus;
  hosts: ParticipantWithRole[];
  participants: ParticipantWithRole[];
}

// ===== API REQUEST TYPES =====

// POST /api/experiences - Create Experience
export interface CreateExperienceRequest {
  experience: {
    name: string;
    code: string;
  };
}

// POST /api/experiences/join - Join Experience
export interface JoinExperienceRequest {
  code: string;
}

// POST /api/experiences/:id/register - Register for Experience
export interface RegisterExperienceRequest {
  code: string;
  email: string;
  name?: string;
}

// POST /api/experiences/:experience_id/blocks - Create Experience Block
export interface CreateExperienceBlockRequest {
  experience: {
    kind: string;
    payload?: Record<string, any>;
    visible_to_roles?: ParticipantRole[];
    visible_to_segments?: string[];
    target_user_ids?: string[];
    status?: 'hidden' | 'visible';
    open_immediately?: boolean;
  };
}

// ===== API RESPONSE TYPES =====

// POST /api/experiences - Create Experience
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

// GET /api/experiences/:id - Get Experience
export interface GetExperienceSuccessResponse {
  type: 'success';
  success: true;
  experience: ExperienceWithParticipants;
  user: ParticipantWithRole | null;
}

export interface GetExperienceErrorResponse {
  type: 'error';
  error: string;
}

export type GetExperienceApiResponse = GetExperienceSuccessResponse | GetExperienceErrorResponse;

// POST /api/experiences/join - Join Experience
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

// POST /api/experiences/:id/register - Register for Experience
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

// POST /api/experiences/open_lobby - Open Lobby
export interface OpenLobbySuccessResponse {
  success: true;
  data: ExperienceModel;
}

export type OpenLobbyResponse = OpenLobbySuccessResponse;

// POST /api/experiences/start - Start Experience
export interface StartExperienceSuccessResponse {
  success: true;
  data: ExperienceModel;
}

export type StartExperienceResponse = StartExperienceSuccessResponse;

// POST /api/experiences/pause - Pause Experience
export interface PauseExperienceSuccessResponse {
  success: true;
  data: ExperienceModel;
}

export type PauseExperienceResponse = PauseExperienceSuccessResponse;

// POST /api/experiences/resume - Resume Experience
export interface ResumeExperienceSuccessResponse {
  success: true;
  data: ExperienceModel;
}

export type ResumeExperienceResponse = ResumeExperienceSuccessResponse;

// POST /api/experiences/:experience_id/blocks - Create Experience Block
export interface CreateExperienceBlockSuccessResponse {
  success: true;
  data: any; // Block data structure would need to be defined based on the orchestrator
}

export type CreateExperienceBlockResponse = CreateExperienceBlockSuccessResponse;

// POST /api/experiences/:experience_id/blocks/:id/open - Open Block
export interface OpenBlockSuccessResponse {
  success: true;
  data: any; // Block data structure would need to be defined based on the orchestrator
}

export type OpenBlockResponse = OpenBlockSuccessResponse;

// POST /api/experiences/:experience_id/blocks/:id/close - Close Block
export interface CloseBlockSuccessResponse {
  success: true;
  data: any; // Block data structure would need to be defined based on the orchestrator
}

export type CloseBlockResponse = CloseBlockSuccessResponse;

// GET /api/users/me - Get Current User
export interface GetCurrentUserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// ===== AUTHENTICATION TYPES =====

// POST /users/sign_in - Request magic link
export interface PasswordlessSignInRequest {
  passwordless: {
    email: string;
  };
}

// Authentication Response Types
export interface PasswordlessSignInResponse {
  // Typically returns HTML page or redirect
  // Success is indicated by redirect to intended page
}

export interface AuthenticationErrorResponse {
  error: string;
  message?: string;
}

// JWT Token Payload
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

// ===== ORCHESTRATION TYPES =====

export interface ExperienceOrchestrationResponse {
  success: boolean;
  data: ExperienceModel;
  error?: string;
}
