import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function getFormData<T>(form: HTMLFormElement): Partial<T> {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries()) as Partial<T>;
}

export function isNotNull<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isNotEmpty<T>(value: T): value is NonNullable<T> {
  if (value === null || value === undefined) return false;

  if (value && typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return value !== '';
}

export function qaLogger(output: string) {
  try {
    // ENV check in the future for non prod envs
    // if (process.env.QA_LOGGING !== "true") return null
    if (true) {
      console.log(`[QA] - ${output}`);
    }
  } catch (error) {
    console.error('[QA Logger Error]:', error);
  }
}

export const getJWTKey = (code: string) => `experience_jwt_${code}`;

const jwtCache = new Map<string, string | null>();

export const getStoredJWT = (code: string) => {
  const key = getJWTKey(code);
  if (jwtCache.has(key)) return jwtCache.get(key) ?? null;
  const val = localStorage.getItem(key);
  jwtCache.set(key, val);
  return val;
};

export const getAdminJWTKey = (code: string) => `experience_admin_jwt_${code}`;

export const getStoredAdminJWT = (code: string) => {
  const key = getAdminJWTKey(code);
  if (jwtCache.has(key)) return jwtCache.get(key) ?? null;
  const val = localStorage.getItem(key);
  jwtCache.set(key, val);
  return val;
};

export const setStoredAdminJWT = (code: string, jwt: string) => {
  const key = getAdminJWTKey(code);
  localStorage.setItem(key, jwt);
  jwtCache.set(key, jwt);
};

export const removeStoredAdminJWT = (code: string) => {
  const key = getAdminJWTKey(code);
  localStorage.removeItem(key);
  jwtCache.delete(key);
};

export const clearAllExperienceJWTs = () => {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('experience_jwt_') || key.startsWith('experience_admin_jwt_'))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
    jwtCache.delete(key);
  });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export const capitalize = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// Session-scoped tracking for experiences created in this browser session
const SESSION_CREATED_EXPERIENCES_KEY = 'created_experiences';
export type CreatedExperience = { code: string; name: string };

export function getSessionCreatedExperiences(): CreatedExperience[] {
  try {
    const raw = sessionStorage.getItem(SESSION_CREATED_EXPERIENCES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CreatedExperience[];
    if (Array.isArray(parsed)) return parsed.filter((e) => e && e.code && e.name);
    return [];
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
