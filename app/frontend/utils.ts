/** Generate a browser fingerprint */
export const generateFingerprint = () => {
  // Try to get existing fingerprint from localStorage
  const stored = localStorage.getItem('browser_fingerprint');
  if (stored) return stored;

  // Generate new fingerprint combining random ID with browser characteristics
  const randomId = 'fp_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  const browserInfo = [
    navigator.userAgent.slice(-50), // Last 50 chars to avoid being too long
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ].join('|');

  const fingerprint = randomId + '_' + btoa(browserInfo).slice(0, 20);

  // Store for future use
  localStorage.setItem('browser_fingerprint', fingerprint);
  return fingerprint;
};

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
