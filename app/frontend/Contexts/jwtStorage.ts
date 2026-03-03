// Experience code is used as the cache key for localStorage lookups.
// Participant JWTs are stored at experience_jwt_{code}.
// Admin JWTs are stored at experience_admin_jwt_{code}.

const participantJWTKey = (code: string) => `experience_jwt_${code}`;
const adminJWTKey = (code: string) => `experience_admin_jwt_${code}`;

const jwtCache = new Map<string, string | null>();

export const isJWTExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const getStoredParticipantJWT = (code: string): string | null => {
  const key = participantJWTKey(code);
  if (jwtCache.has(key)) return jwtCache.get(key) ?? null;
  const val = localStorage.getItem(key);
  jwtCache.set(key, val);
  return val;
};

export const setStoredParticipantJWT = (code: string, jwt: string) => {
  const key = participantJWTKey(code);
  localStorage.setItem(key, jwt);
  jwtCache.set(key, jwt);
};

export const removeStoredParticipantJWT = (code: string) => {
  const key = participantJWTKey(code);
  localStorage.removeItem(key);
  jwtCache.delete(key);
};

export const getStoredAdminJWT = (code: string): string | null => {
  const key = adminJWTKey(code);
  if (jwtCache.has(key)) return jwtCache.get(key) ?? null;
  const val = localStorage.getItem(key);
  jwtCache.set(key, val);
  return val;
};

export const setStoredAdminJWT = (code: string, jwt: string) => {
  const key = adminJWTKey(code);
  localStorage.setItem(key, jwt);
  jwtCache.set(key, jwt);
};

export const removeStoredAdminJWT = (code: string) => {
  const key = adminJWTKey(code);
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
