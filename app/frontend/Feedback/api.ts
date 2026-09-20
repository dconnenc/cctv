import { getStoredAdminJWT, getStoredParticipantJWT } from '@cctv/contexts/jwtStorage';
import { FeedbackSource, FeedbackType } from '@cctv/types';

import { type ConsoleEntry } from './consoleBuffer';
import { type FeedbackContextPayload, currentExperienceCode } from './feedbackContext';

export interface FeedbackDraft {
  feedbackType: FeedbackType;
  source: FeedbackSource;
  title?: string;
  description: string;
  experienceCode?: string;
  experienceBlockId?: string;
  errorFingerprint?: string;
  context: FeedbackContextPayload;
  consoleLogs: ConsoleEntry[];
  attachmentSignedIds?: string[];
}

export interface FeedbackRecord {
  id: string;
  feedback_type: FeedbackType;
  source: FeedbackSource;
  title: string | null;
  description: string | null;
  created_at: string;
}

export type FeedbackResult =
  | { success: true; feedback: FeedbackRecord }
  | { success: false; error: string };

/** Wire shape accepted by Api::FeedbacksController. */
interface FeedbackRequestBody {
  feedback: {
    feedback_type: FeedbackType;
    source?: FeedbackSource;
    title?: string;
    description: string;
    experience_code?: string;
    experience_block_id?: string;
    error_fingerprint?: string;
    context?: FeedbackContextPayload;
    console_logs?: ConsoleEntry[];
    attachment_signed_ids: string[];
  };
}

interface FeedbackResponseBody {
  success?: boolean;
  error?: string;
  feedback?: FeedbackRecord;
}

export async function createFeedback(draft: FeedbackDraft): Promise<FeedbackResult> {
  return request('/api/feedbacks', 'POST', {
    feedback: {
      feedback_type: draft.feedbackType,
      source: draft.source,
      title: draft.title,
      description: draft.description,
      experience_code: draft.experienceCode ?? currentExperienceCode(),
      experience_block_id: draft.experienceBlockId,
      error_fingerprint: draft.errorFingerprint,
      context: draft.context,
      console_logs: draft.consoleLogs,
      attachment_signed_ids: draft.attachmentSignedIds ?? [],
    },
  });
}

export interface FeedbackEnrichment {
  id: string;
  feedbackType: FeedbackType;
  title?: string;
  description: string;
  attachmentSignedIds?: string[];
}

export async function enrichFeedback(input: FeedbackEnrichment): Promise<FeedbackResult> {
  return request(`/api/feedbacks/${input.id}`, 'PATCH', {
    feedback: {
      feedback_type: input.feedbackType,
      title: input.title,
      description: input.description,
      attachment_signed_ids: input.attachmentSignedIds ?? [],
    },
  });
}

/** The experience JWT identifies participants who have no browser session. */
export function feedbackAuthHeaders(): Record<string, string> {
  const code = currentExperienceCode();
  if (!code) return {};

  const jwt = getStoredAdminJWT(code) ?? getStoredParticipantJWT(code);
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

async function request(
  url: string,
  method: 'POST' | 'PATCH',
  body: FeedbackRequestBody,
): Promise<FeedbackResult> {
  try {
    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...feedbackAuthHeaders() },
      body: JSON.stringify(body),
    });

    const parsed: FeedbackResponseBody = await response.json().catch(() => ({}));

    if (response.ok && parsed.success === true && parsed.feedback) {
      return { success: true, feedback: parsed.feedback };
    }

    return { success: false, error: parsed.error ?? `Feedback failed (${response.status})` };
  } catch {
    return { success: false, error: 'Could not reach the server' };
  }
}
