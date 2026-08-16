import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ExperienceActionButton from './ExperienceActionButton';

const { startExperience, pauseExperience, resumeExperience, useExperienceMock } = vi.hoisted(
  () => ({
    startExperience: vi.fn(),
    pauseExperience: vi.fn(),
    resumeExperience: vi.fn(),
    useExperienceMock: vi.fn(),
  }),
);

vi.mock('@cctv/contexts/ExperienceContext', () => ({
  useExperience: () => useExperienceMock(),
}));

vi.mock('@cctv/hooks/useExperienceStart', () => ({
  useExperienceStart: () => ({ startExperience, error: null }),
}));

vi.mock('@cctv/hooks/useExperiencePause', () => ({
  useExperiencePause: () => ({ pauseExperience, error: null }),
}));

vi.mock('@cctv/hooks/useExperienceResume', () => ({
  useExperienceResume: () => ({ resumeExperience, error: null }),
}));

function renderWithStatus(status: string | undefined) {
  useExperienceMock.mockReturnValue({
    experience: status ? { id: 'exp-1', status } : null,
  });
  return render(<ExperienceActionButton />);
}

describe('ExperienceActionButton', () => {
  beforeEach(() => {
    startExperience.mockReset();
    pauseExperience.mockReset();
    resumeExperience.mockReset();
    useExperienceMock.mockReset();
  });

  it.each(['draft', 'lobby'])('starts the experience from %s', async (status) => {
    const user = userEvent.setup();
    renderWithStatus(status);

    await user.click(screen.getByRole('button', { name: /start/i }));

    expect(startExperience).toHaveBeenCalledTimes(1);
  });

  it('pauses a live experience', async () => {
    const user = userEvent.setup();
    renderWithStatus('live');

    await user.click(screen.getByRole('button', { name: /pause/i }));

    expect(pauseExperience).toHaveBeenCalledTimes(1);
    expect(startExperience).not.toHaveBeenCalled();
  });

  it('resumes a paused experience', async () => {
    const user = userEvent.setup();
    renderWithStatus('paused');

    await user.click(screen.getByRole('button', { name: /resume/i }));

    expect(resumeExperience).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for a status with no action', () => {
    const { container } = renderWithStatus('ended');

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing before the experience loads', () => {
    const { container } = renderWithStatus(undefined);

    expect(container).toBeEmptyDOMElement();
  });
});
