import type { JsonValue, ParticipantSummary } from '@cctv/types';

export function getFormData<T>(form: HTMLFormElement): Partial<T> {
  const formData = new FormData(form);
  // SAFETY: every key here is the `name` of a control the caller's own form rendered, and
  // callers pass that form's field contract as T; Partial covers controls left unrendered.
  return Object.fromEntries(formData.entries()) as Partial<T>;
}

export function getFieldValue(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field.value.trim();
  }
  return '';
}

export const TEMPLATE_NAME_FALLBACK = 'friend';

const PARTICIPANT_NAME_TOKEN = /\{\{\s*participant_name\s*\}\}/g;

export function renderNameTemplate(
  template: string | null | undefined,
  participant?: Pick<ParticipantSummary, 'name' | 'email'> | null,
): string {
  if (!template) return '';
  const name = participant?.name?.trim() || participant?.email?.trim() || TEMPLATE_NAME_FALLBACK;
  return template.replace(PARTICIPANT_NAME_TOKEN, name);
}

export function isNotNull<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function qaLogger(output: string) {
  try {
    console.log(`[QA] - ${output}`);
  } catch (error) {
    console.error('[QA Logger Error]:', error);
  }
}

export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export const capitalize = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// Session-scoped tracking for experiences created in this browser session
const SESSION_CREATED_EXPERIENCES_KEY = 'created_experiences';
export type CreatedExperience = { code: string; name: string };

function readCreatedExperience(entry: JsonValue): CreatedExperience[] {
  if (entry === null || Array.isArray(entry) || !(entry instanceof Object)) return [];
  const { code, name } = entry;
  if (!code || !name) return [];
  return [{ code: String(code), name: String(name) }];
}

export function getSessionCreatedExperiences(): CreatedExperience[] {
  try {
    const raw = sessionStorage.getItem(SESSION_CREATED_EXPERIENCES_KEY);
    if (!raw) return [];
    const parsed: JsonValue = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap(readCreatedExperience);
  } catch {
    return [];
  }
}

export function addSessionCreatedExperience(exp: CreatedExperience) {
  const existing = getSessionCreatedExperiences();
  const deduped = existing.filter((e) => e.code !== exp.code);
  deduped.unshift(exp);
  sessionStorage.setItem(SESSION_CREATED_EXPERIENCES_KEY, JSON.stringify(deduped.slice(0, 20)));
}
