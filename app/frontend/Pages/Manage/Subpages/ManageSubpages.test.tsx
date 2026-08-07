import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlockKind } from '@cctv/types';
import type { Block } from '@cctv/types';

import ManageDebugPage from './ManageDebugPage';
import ManageParticipantsPage from './ManageParticipantsPage';
import ManagePlaybillPage from './ManagePlaybillPage';

const { navigate, useExperienceMock } = vi.hoisted(() => ({
  navigate: vi.fn(),
  useExperienceMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('@cctv/contexts/ExperienceContext', () => ({
  useExperience: () => useExperienceMock(),
}));

vi.mock('../ParticipantsTab/ParticipantsTab', () => ({
  default: ({ participants }: { participants: { id: string }[] }) => (
    <div>participants: {participants.length}</div>
  ),
}));

vi.mock('../PlaybillTab/PlaybillTab', () => ({
  default: ({ playbillEnabled }: { playbillEnabled: boolean }) => (
    <div>playbill enabled: {String(playbillEnabled)}</div>
  ),
}));

vi.mock('../Viewer/DebugPanel/DebugPanel', () => ({
  default: ({ selectedBlock }: { selectedBlock?: Block }) => (
    <div>debug block: {selectedBlock?.id ?? 'none'}</div>
  ),
}));

function setExperience(overrides: Record<string, unknown> = {}) {
  useExperienceMock.mockReturnValue({
    experience: {
      id: 'exp-1',
      code: 'FOCUSTEST',
      hosts: [{ id: 'h1', name: 'Cam' }],
      participants: [{ id: 'p1', name: 'Nina' }],
      segments: [],
      blocks: [],
      playbill: [],
      playbill_enabled: true,
      ...overrides,
    },
    code: 'FOCUSTEST',
    isLoading: false,
    wsReady: true,
  });
}

function renderPage(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Manage subpages', () => {
  beforeEach(() => {
    navigate.mockReset();
    useExperienceMock.mockReset();
    setExperience();
  });

  it('shows participants with hosts folded in', () => {
    renderPage(<ManageParticipantsPage />);

    expect(screen.getByRole('heading', { name: 'Participants' })).toBeInTheDocument();
    expect(screen.getByText('participants: 2')).toBeInTheDocument();
  });

  it('shows the playbill', () => {
    renderPage(<ManagePlaybillPage />);

    expect(screen.getByRole('heading', { name: 'Playbill' })).toBeInTheDocument();
    expect(screen.getByText('playbill enabled: true')).toBeInTheDocument();
  });

  it('hands the open block to the debug panel', () => {
    setExperience({
      blocks: [
        { id: 'closed-1', kind: BlockKind.POLL, status: 'closed', position: 0, payload: {} },
        { id: 'open-1', kind: BlockKind.POLL, status: 'open', position: 1, payload: {} },
      ],
    });
    renderPage(<ManageDebugPage />);

    expect(screen.getByRole('heading', { name: 'Debug' })).toBeInTheDocument();
    expect(screen.getByText('debug block: open-1')).toBeInTheDocument();
  });

  it('copes with no open block on the debug page', () => {
    renderPage(<ManageDebugPage />);

    expect(screen.getByText('debug block: none')).toBeInTheDocument();
  });

  it('routes back to focus mode', async () => {
    const user = userEvent.setup();
    renderPage(<ManageParticipantsPage />);

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(navigate).toHaveBeenCalledWith('/experiences/FOCUSTEST/manage/focus');
  });

  it('waits for the websocket before rendering', () => {
    useExperienceMock.mockReturnValue({
      experience: null,
      code: 'FOCUSTEST',
      isLoading: false,
      wsReady: false,
    });
    renderPage(<ManageParticipantsPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Participants' })).not.toBeInTheDocument();
  });
});
