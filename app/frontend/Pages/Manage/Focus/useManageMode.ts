export type ManageMode = 'focus' | 'manage';

const STORAGE_KEY = 'cctv_manage_mode';

export function getManageMode(): ManageMode | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'focus' || stored === 'manage' ? stored : null;
}

export function setManageMode(mode: ManageMode) {
  localStorage.setItem(STORAGE_KEY, mode);
}
