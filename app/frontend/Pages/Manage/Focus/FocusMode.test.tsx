import { MemoryRouter } from 'react-router-dom';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExperienceStateProvider } from '@cctv/contexts/ExperienceStateContext';
import { BlockKind } from '@cctv/types';
import type { Block, Experience } from '@cctv/types';

import FocusMode from './FocusMode';

const useExperienceMock = vi.fn();

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

vi.mock('@cctv/hooks/useBlockPresentation', () => ({
  useBlockPresentation: () => ({
    handlePresent: vi.fn(),
    handleStopPresenting: vi.fn(),
    handlePlayNext: vi.fn(),
    closeBlock: vi.fn(),
    busyBlockId: undefined,
    statusError: null,
    setStatusError: vi.fn(),
  }),
}));

function block(id: string, kind: BlockKind, status: Block['status'], payload = {}): Block {
  return { id, kind, status, position: 0, payload } as Block;
}

function experienceWith(blocks: Block[]): Experience {
  return {
    id: 'exp-1',
    name: 'Focus Mode Test',
    code: 'FOCUSTEST',
    status: 'lobby',
    blocks,
    hosts: [],
    participants: [],
    segments: [],
  } as unknown as Experience;
}

function setExperience(blocks: Block[]) {
  useExperienceMock.mockReturnValue({
    experience: experienceWith(blocks),
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
      block('draft-1', BlockKind.POLL, 'hidden', { question: 'Closing sketch?' }),
      { ...block('child-1', BlockKind.QUESTION, 'hidden'), parent_block_id: 'draft-1' } as Block,
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
      { ...block('past-1', BlockKind.POLL, 'closed', { question: 'First bit' }), position: 0 },
      { ...block('past-2', BlockKind.QUESTION, 'closed', { question: 'Second bit' }), position: 1 },
      { ...block('draft-1', BlockKind.BUZZER, 'hidden', { question: 'Draft bit' }), position: 2 },
      {
        ...block('child-1', BlockKind.QUESTION, 'closed'),
        parent_block_id: 'past-1',
        position: 3,
      } as Block,
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
    setExperience([block('draft-1', BlockKind.POLL, 'hidden')]);
    renderFocusMode();

    await user.click(screen.getByRole('tab', { name: /history/i }));

    expect(screen.getByText('Nothing has run yet.')).toBeInTheDocument();
  });

  it('opens a read-only review for a finished activity', async () => {
    const user = userEvent.setup();
    setExperience([
      {
        ...block('past-1', BlockKind.POLL, 'closed', { question: 'Closing sketch?', options: [] }),
        responses: { total: 12 },
      } as Block,
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
    setExperience([block('past-1', BlockKind.POLL, 'closed', { question: 'Closing sketch?' })]);
    renderFocusMode();

    await user.click(screen.getByRole('tab', { name: /history/i }));
    await user.click(screen.getByText('Closing sketch?'));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('tab', { name: /history/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Closing sketch?')).toBeInTheDocument();
  });

  it('starts on the live stage when a block is already open', () => {
    setExperience([
      block('open-1', BlockKind.POLL, 'open', { question: 'Live poll', options: [] }),
    ]);
    renderFocusMode();

    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
