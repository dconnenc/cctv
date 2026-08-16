import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsIdentity } from './AnalyticsIdentity';

const { useUserMock, identifyUserMock, resetAnalyticsMock } = vi.hoisted(() => ({
  useUserMock: vi.fn(),
  identifyUserMock: vi.fn(),
  resetAnalyticsMock: vi.fn(),
}));

vi.mock('@cctv/contexts', () => ({ useUser: useUserMock }));
vi.mock('./client', () => ({ identifyUser: identifyUserMock, resetAnalytics: resetAnalyticsMock }));

const user = {
  id: 'user-1',
  email: 'a@b.com',
  name: 'A',
  role: 'user',
  admin: false,
  super_admin: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  useUserMock.mockReturnValue({ user: null });
});

describe('AnalyticsIdentity', () => {
  it('identifies the user once when a user is present', () => {
    useUserMock.mockReturnValue({ user });
    const { rerender } = render(<AnalyticsIdentity />);

    expect(identifyUserMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ email: 'a@b.com', name: 'A', role: 'user', is_admin: false }),
    );

    rerender(<AnalyticsIdentity />);
    expect(identifyUserMock).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is no user', () => {
    useUserMock.mockReturnValue({ user: null });
    render(<AnalyticsIdentity />);

    expect(identifyUserMock).not.toHaveBeenCalled();
    expect(resetAnalyticsMock).not.toHaveBeenCalled();
  });

  it('resets analytics when the user logs out', () => {
    useUserMock.mockReturnValue({ user });
    const { rerender } = render(<AnalyticsIdentity />);

    useUserMock.mockReturnValue({ user: null });
    rerender(<AnalyticsIdentity />);

    expect(resetAnalyticsMock).toHaveBeenCalledTimes(1);
  });

  it('flags admins via is_admin', () => {
    useUserMock.mockReturnValue({ user: { ...user, admin: true } });
    render(<AnalyticsIdentity />);

    expect(identifyUserMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ is_admin: true }),
    );
  });
});
