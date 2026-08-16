import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExperienceAnalytics } from './ExperienceAnalytics';

const { useExperienceMock, identifyGroupMock, setPersonPropsMock } = vi.hoisted(() => ({
  useExperienceMock: vi.fn(),
  identifyGroupMock: vi.fn(),
  setPersonPropsMock: vi.fn(),
}));

vi.mock('@cctv/contexts', () => ({ useExperience: useExperienceMock }));
vi.mock('./client', () => ({
  identifyExperienceGroup: identifyGroupMock,
  setPersonProperties: setPersonPropsMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  useExperienceMock.mockReturnValue({ experience: undefined, participant: undefined, code: 'ABC' });
});

describe('ExperienceAnalytics', () => {
  it('associates events with the experience group when an experience is present', () => {
    useExperienceMock.mockReturnValue({
      experience: { id: 'exp-1', name: 'My Show' },
      participant: undefined,
      code: 'ABC',
    });

    render(<ExperienceAnalytics />);

    expect(identifyGroupMock).toHaveBeenCalledWith('exp-1', { code: 'ABC', name: 'My Show' });
  });

  it('records the participant role on the person profile', () => {
    useExperienceMock.mockReturnValue({
      experience: { id: 'exp-1', name: 'My Show' },
      participant: { role: 'host' },
      code: 'ABC',
    });

    render(<ExperienceAnalytics />);

    expect(setPersonPropsMock).toHaveBeenCalledWith({ experience_role: 'host' });
  });

  it('does nothing without an experience', () => {
    useExperienceMock.mockReturnValue({
      experience: undefined,
      participant: undefined,
      code: 'ABC',
    });

    render(<ExperienceAnalytics />);

    expect(identifyGroupMock).not.toHaveBeenCalled();
    expect(setPersonPropsMock).not.toHaveBeenCalled();
  });

  it('groups only once for the same experience', () => {
    useExperienceMock.mockReturnValue({
      experience: { id: 'exp-1', name: 'My Show' },
      participant: undefined,
      code: 'ABC',
    });

    const { rerender } = render(<ExperienceAnalytics />);
    rerender(<ExperienceAnalytics />);

    expect(identifyGroupMock).toHaveBeenCalledTimes(1);
  });
});
