// ===== CORE DOMAIN TYPES =====

export type UserRole = 'user' | 'admin' | 'superadmin';

export type ExperienceStatus = 'draft' | 'lobby' | 'live' | 'paused' | 'finished' | 'archived';

export type ParticipantRole = 'audience' | 'player' | 'moderator' | 'host';

export type ParticipantStatus = 'registered' | 'active';

export type BlockStatus = "hidden" | "open" | "closed";

// ===== COMPLETE ENTITY TYPES =====

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Experience {
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

export interface Block {
  id: string;
  kind: string;
  status: BlockStatus;
  payload?: Record<string, any>;
  visible_to_roles?: ParticipantRole[];
  visible_to_segments?: string[];
  target_user_ids?: string[];
  created_at?: string;
  updated_at?: string;
  responses?: {
    total: number;
    user_responded: boolean;
    aggregate?: Record<string, number>;
  };
}

// ===== TYPE FRAGMENTS (UTILITY TYPES) =====

export type UserSummary = Pick<User, 'id' | 'name' | 'email'>;

export interface UserWithRole extends UserSummary {
  role: ParticipantRole;
}

export type ExperienceSummary = Pick<Experience, 'id' | 'name' | 'code' | 'status'>;

export interface ExperienceWithParticipants extends ExperienceSummary {
  hosts: UserWithRole[];
  participants: UserWithRole[];
}

export interface ExperienceWithBlocks extends ExperienceSummary {
  blocks: Block[];
}

export interface ExperienceWithDetails extends ExperienceSummary {
  hosts: UserWithRole[];
  participants: UserWithRole[];
  blocks: Block[];
}

// ===== FRONTEND-SPECIFIC EXPERIENCE TYPES =====

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

export type ExperienceType = PollExperience | QuestionExperience | MultistepFormExperience;

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
  experience: ExperienceWithDetails;
  user: UserWithRole | null;
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

export interface ExperienceContextType {
  experience: ExperienceWithDetails | null;
  user: UserWithRole | null;
  code: string;
  jwt: string | null;

  isAuthenticated: boolean;
  isLoading: boolean;
  isPolling: boolean;
  experienceStatus: 'lobby' | 'live';
  error: string | null;

  setJWT: (token: string) => void;
  clearJWT: () => void;
  experienceFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

