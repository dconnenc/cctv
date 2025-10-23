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
export const getStoredJWT = (code: string) => localStorage.getItem(getJWTKey(code));

export const getAdminJWTKey = (code: string) => `experience_admin_jwt_${code}`;
export const getStoredAdminJWT = (code: string) => localStorage.getItem(getAdminJWTKey(code));
export const setStoredAdminJWT = (code: string, jwt: string) =>
  localStorage.setItem(getAdminJWTKey(code), jwt);
export const removeStoredAdminJWT = (code: string) => localStorage.removeItem(getAdminJWTKey(code));

export const clearAllExperienceJWTs = () => {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('experience_jwt_') || key.startsWith('experience_admin_jwt_'))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export const capitalize = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
