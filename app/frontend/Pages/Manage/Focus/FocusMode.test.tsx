import { MemoryRouter } from 'react-router-dom';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExperienceStateProvider } from '@cctv/contexts/ExperienceStateContext';
import { BlockKind } from '@cctv/types';
import type { Block } from '@cctv/types';

import { announcementBlock, experience, pollBlock, questionBlock } from '../testFactories';
import FocusMode from './FocusMode';

const { useExperienceMock, handlePresent, handleStopPresenting, closeBlock, navigate } = vi.hoisted(
  () => ({
    useExperienceMock: vi.fn(),
    handlePresent: vi.fn(),
    handleStopPresenting: vi.fn(),
    closeBlock: vi.fn(),
    navigate: vi.fn(),
  }),
);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('@cctv/contexts/ExperienceContext', () => ({
  useExperience: () => useExperienceMock(),
  ExperienceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@cctv/contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({
    adminJWT: 'test-admin-jwt',
    adminFetch: vi.fn(),
    isAdminLoading: false,
  }),
  AdminAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@cctv/hooks/useUpdateExperienceBlock', () => ({
  useUpdateExperienceBlock: () => ({
    updateExperienceBlock: vi.fn().mockResolvedValue({ success: true }),
    isLoading: false,
    error: null,
    setError: vi.fn(),
  }),
}));

vi.mock('@cctv/hooks/useBlockPresentation', () => ({
  useBlockPresentation: () => ({
    handlePresent,
    handleStopPresenting,
    handlePlayNext: vi.fn(),
    closeBlock,
    busyBlockId: undefined,
    statusError: null,
    setStatusError: vi.fn(),
  }),
}));

function setExperience(blocks: Block[]) {
  useExperienceMock.mockReturnValue({
    experience: experience({ blocks }),
    code: 'FOCUSTEST',
    isLoading: false,
    wsReady: true,
  });
}

function renderFocusMode() {
  return render(
    <MemoryRouter initialEntries={['/experiences/FOCUSTEST/manage/focus']}>
      <ExperienceStateProvider>
        <FocusMode />
      </ExperienceStateProvider>
    </MemoryRouter>,
  );
}

describe('FocusMode', () => {
  beforeEach(() => {
    useExperienceMock.mockReset();
    handlePresent.mockReset().mockResolvedValue(undefined);
    handleStopPresenting.mockReset().mockResolvedValue(undefined);
    closeBlock.mockReset().mockResolvedValue(undefined);
    navigate.mockReset();
    localStorage.clear();
  });

  it('shows a tile for every activity kind', () => {
    setExperience([]);
    renderFocusMode();

    const newSection = screen.getByRole('heading', { name: 'Choose an activity' }).parentElement!;
    const tiles = within(newSection).getAllByRole('button');

    expect(tiles).toHaveLength(Object.values(BlockKind).length);
    expect(within(newSection).getByText('Family Feud')).toBeInTheDocument();
  });

  it('lists hidden blocks as drafts and excludes child blocks', () => {
    setExperience([
      pollBlock({ id: 'draft-1', payload: { question: 'Closing sketch?', options: [] } }),
      questionBlock({ id: 'child-1', parent_block_id: 'draft-1' }),
    ]);
    renderFocusMode();

    const draftSection = screen.getByRole('heading', { name: 'Drafts' }).parentElement!;
    expect(within(draftSection).getAllByRole('button')).toHaveLength(1);
    expect(within(draftSection).getByText('Closing sketch?')).toBeInTheDocument();
  });

  it('opens the editor with Play and draft actions when a kind is chosen', async () => {
    const user = userEvent.setup();
    setExperience([]);
    renderFocusMode();

    const newSection = screen.getByRole('heading', { name: 'Choose an activity' }).parentElement!;
    await user.click(within(newSection).getByText('Poll'));

    expect(screen.getByRole('heading', { name: 'New Poll' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument();
  });

  it('returns to the activity list from the editor', async () => {
    const user = userEvent.setup();
    setExperience([]);
    renderFocusMode();

    const newSection = screen.getByRole('heading', { name: 'Choose an activity' }).parentElement!;
    await user.click(within(newSection).getByText('Announcement'));
    expect(screen.getByRole('heading', { name: 'New Announcement' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('heading', { name: 'Choose an activity' })).toBeInTheDocument();
  });

  it('lists finished activities under History, newest first', async () => {
    const user = userEvent.setup();
    setExperience([
      pollBlock({
        id: 'past-1',
        status: 'closed',
        position: 0,
        payload: { question: 'First bit', options: [] },
      }),
      questionBlock({
        id: 'past-2',
        status: 'closed',
        position: 1,
        payload: { question: 'Second bit', formKey: 'second' },
      }),
      announcementBlock({ id: 'draft-1', position: 2, payload: { message: 'Draft bit' } }),
      questionBlock({ id: 'child-1', status: 'closed', position: 3, parent_block_id: 'past-1' }),
    ]);
    renderFocusMode();

    await user.click(screen.getByRole('tab', { name: /history/i }));

    const rows = screen.getAllByRole('button').filter((el) => el.textContent?.includes('bit'));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Second bit');
    expect(rows[1]).toHaveTextContent('First bit');
  });

  it('shows an empty state when nothing has run', async () => {
    const user = userEvent.setup();
    setExperience([pollBlock({ id: 'draft-1' })]);
    renderFocusMode();

    await user.click(screen.getByRole('tab', { name: /history/i }));

    expect(screen.getByText('Nothing has run yet.')).toBeInTheDocument();
  });

  it('opens a read-only review for a finished activity', async () => {
    const user = userEvent.setup();
    setExperience([
      pollBlock({
        id: 'past-1',
        status: 'closed',
        payload: { question: 'Closing sketch?', options: [] },
        responses: { total: 12 },
      }),
    ]);
    renderFocusMode();

    await user.click(screen.getByRole('tab', { name: /history/i }));
    await user.click(screen.getByText('Closing sketch?'));

    expect(screen.getByRole('heading', { name: 'Poll' })).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
    expect(screen.getByText('12 responses')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /finish/i })).not.toBeInTheDocument();
  });

  it('returns to the History tab from a review', async () => {
    const user = userEvent.setup();
    setExperience([
      pollBlock({
        id: 'past-1',
        status: 'closed',
        payload: { question: 'Closing sketch?', options: [] },
      }),
    ]);
    renderFocusMode();

    await user.click(screen.getByRole('tab', { name: /history/i }));
    await user.click(screen.getByText('Closing sketch?'));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('tab', { name: /history/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Closing sketch?')).toBeInTheDocument();
  });

  it('starts on the live stage when a block is already open', () => {
    setExperience([
      pollBlock({ id: 'open-1', status: 'open', payload: { question: 'Live poll', options: [] } }),
    ]);
    renderFocusMode();

    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('closes the open block and returns to the activity list on Finish', async () => {
    const user = userEvent.setup();
    const open = pollBlock({
      id: 'open-1',
      status: 'open',
      payload: { question: 'Live poll', options: [] },
    });
    setExperience([open]);
    renderFocusMode();

    await user.click(screen.getByRole('button', { name: /finish/i }));

    expect(handleStopPresenting).toHaveBeenCalledTimes(1);
    expect(handleStopPresenting).toHaveBeenCalledWith(open);
    expect(screen.getByRole('heading', { name: 'Choose an activity' })).toBeInTheDocument();
  });

  it('puts a draft on the monitor when it is played from the editor', async () => {
    const user = userEvent.setup();
    const draft = announcementBlock({ id: 'draft-1', payload: { message: 'Phones out.' } });
    setExperience([draft]);
    renderFocusMode();

    const draftSection = screen.getByRole('heading', { name: 'Drafts' }).parentElement!;
    await user.click(within(draftSection).getByText('Phones out.'));
    await user.click(screen.getByRole('button', { name: /^play$/i }));

    expect(handlePresent).toHaveBeenCalledTimes(1);
    expect(handlePresent).toHaveBeenCalledWith(draft);
  });

  it('does not present anything when a draft is saved rather than played', async () => {
    const user = userEvent.setup();
    setExperience([announcementBlock({ id: 'draft-1', payload: { message: 'Phones out.' } })]);
    renderFocusMode();

    const draftSection = screen.getByRole('heading', { name: 'Drafts' }).parentElement!;
    await user.click(within(draftSection).getByText('Phones out.'));
    await user.click(screen.getByRole('button', { name: /save as draft/i }));

    expect(handlePresent).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Choose an activity' })).toBeInTheDocument();
  });

  it('remembers focus mode as the preferred manage view', () => {
    setExperience([]);
    renderFocusMode();

    expect(localStorage.getItem('cctv_manage_mode')).toBe('focus');
  });
});
