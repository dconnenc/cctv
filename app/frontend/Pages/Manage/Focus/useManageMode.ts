export type ManageMode = 'focus' | 'manage';

const STORAGE_KEY = 'cctv_manage_mode';

export function getManageMode(): ManageMode | null {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'focus' || stored === 'manage' ? stored : null;
}

export function setManageMode(mode: ManageMode) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, mode);
}
