import { beforeEach, describe, expect, it } from 'vitest';

import { getManageMode, setManageMode } from './useManageMode';

describe('useManageMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has no preference until one is set', () => {
    expect(getManageMode()).toBeNull();
  });

  it('round-trips a stored preference', () => {
    setManageMode('focus');
    expect(getManageMode()).toBe('focus');

    setManageMode('manage');
    expect(getManageMode()).toBe('manage');
  });

  it('ignores a value it does not recognise', () => {
    localStorage.setItem('cctv_manage_mode', 'something-else');

    expect(getManageMode()).toBeNull();
  });
});
