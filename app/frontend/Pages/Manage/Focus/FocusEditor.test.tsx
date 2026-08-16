import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlockKind } from '@cctv/types';
import type { Block, ParticipantSummary, PollBlock } from '@cctv/types';

import { pollBlock } from '../testFactories';
import FocusEditor from './FocusEditor';

const { createExperienceBlock, updateExperienceBlock } = vi.hoisted(() => ({
  createExperienceBlock: vi.fn(),
  updateExperienceBlock: vi.fn(),
}));

vi.mock('@cctv/contexts/ExperienceContext', () => ({
  useExperience: () => ({
    experience: { id: 'exp-1', code: 'FOCUSTEST', segments: [], blocks: [] },
    code: 'FOCUSTEST',
    isLoading: false,
    wsReady: true,
  }),
}));

vi.mock('@cctv/contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({ adminJWT: 'jwt', adminFetch: vi.fn(), isAdminLoading: false }),
}));

vi.mock('@cctv/hooks/useCreateExperienceBlock', async () => {
  const { useState } = await import('react');
  return {
    useCreateExperienceBlock: () => {
      const [error, setError] = useState<string | null>(null);
      return { createExperienceBlock, isLoading: false, error, setError };
    },
  };
});

vi.mock('@cctv/hooks/useUpdateExperienceBlock', async () => {
  const { useState } = await import('react');
  return {
    useUpdateExperienceBlock: () => {
      const [error, setError] = useState<string | null>(null);
      return { updateExperienceBlock, isLoading: false, error, setError };
    },
  };
});

const participants: ParticipantSummary[] = [];

function renderEditor(block?: Block) {
  const onBack = vi.fn();
  const onDone = vi.fn();
  const onEndCurrentBlock = vi.fn().mockResolvedValue(undefined);

  render(
    <FocusEditor
      kind={block?.kind ?? BlockKind.POLL}
      block={block}
      participants={participants}
      onBack={onBack}
      onDone={onDone}
      onEndCurrentBlock={onEndCurrentBlock}
    />,
  );

  return { onBack, onDone, onEndCurrentBlock };
}

async function fillPoll(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Poll Question'), 'Best opener?');
  await user.type(screen.getByLabelText('Option 1'), 'Improv set');
  await user.type(screen.getByLabelText('Option 2'), 'Stand-up');
}

function draftPoll(): PollBlock {
  return pollBlock({
    id: 'draft-1',
    payload: { question: 'Closing sketch?', options: ['The Bit', 'Cold Open'] },
    responses: { total: 0 },
  });
}

describe('FocusEditor — creating', () => {
  beforeEach(() => {
    createExperienceBlock.mockReset().mockResolvedValue({ success: true });
    updateExperienceBlock.mockReset().mockResolvedValue({ success: true });
  });

  it('opens on the chosen kind', () => {
    renderEditor();

    expect(screen.getByRole('heading', { name: 'New Poll' })).toBeInTheDocument();
    expect(screen.getByLabelText('Poll Question')).toBeInTheDocument();
  });

  it('creates an open block when Play is pressed', async () => {
    const user = userEvent.setup();
    const { onDone } = renderEditor();

    await fillPoll(user);
    await user.click(screen.getByRole('button', { name: /play/i }));

    expect(createExperienceBlock).toHaveBeenCalledTimes(1);
    expect(createExperienceBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: BlockKind.POLL,
        status: 'open',
        open_immediately: true,
        payload: expect.objectContaining({
          question: 'Best opener?',
          options: ['Improv set', 'Stand-up'],
        }),
      }),
    );
    expect(onDone).toHaveBeenCalledWith('play');
  });

  it('closes whatever was already playing after starting a new one', async () => {
    const user = userEvent.setup();
    const { onEndCurrentBlock } = renderEditor();

    await fillPoll(user);
    await user.click(screen.getByRole('button', { name: /play/i }));

    expect(onEndCurrentBlock).toHaveBeenCalledTimes(1);
  });

  it('creates a hidden block when Save as draft is pressed', async () => {
    const user = userEvent.setup();
    const { onDone, onEndCurrentBlock } = renderEditor();

    await fillPoll(user);
    await user.click(screen.getByRole('button', { name: /save as draft/i }));

    expect(createExperienceBlock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'hidden', open_immediately: false }),
    );
    expect(onDone).toHaveBeenCalledWith('draft');
    expect(onEndCurrentBlock).not.toHaveBeenCalled();
  });

  it('does not fire a call when the form is invalid', async () => {
    const user = userEvent.setup();
    const { onDone } = renderEditor();

    await user.click(screen.getByRole('button', { name: /play/i }));

    expect(createExperienceBlock).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByText('Poll question is required')).toBeInTheDocument();
  });

  it('leaves without creating anything when Back is pressed', async () => {
    const user = userEvent.setup();
    const { onBack, onDone } = renderEditor();

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(createExperienceBlock).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('FocusEditor — editing a draft', () => {
  beforeEach(() => {
    createExperienceBlock.mockReset().mockResolvedValue({ success: true });
    updateExperienceBlock.mockReset().mockResolvedValue({ success: true });
  });

  it('loads the draft into the form', () => {
    renderEditor(draftPoll());

    expect(screen.getByRole('heading', { name: 'Poll' })).toBeInTheDocument();
    expect(screen.getByLabelText('Poll Question')).toHaveValue('Closing sketch?');
    expect(screen.getByLabelText('Option 1')).toHaveValue('The Bit');
  });

  it('saves edits and reports the play intent', async () => {
    const user = userEvent.setup();
    const { onDone } = renderEditor(draftPoll());

    await user.click(screen.getByRole('button', { name: /play/i }));

    expect(updateExperienceBlock).toHaveBeenCalledTimes(1);
    expect(updateExperienceBlock.mock.calls[0][0]).toBe('draft-1');
    expect(createExperienceBlock).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledWith('play');
  });

  it('saves edits and stays a draft when Save as draft is pressed', async () => {
    const user = userEvent.setup();
    const { onDone } = renderEditor(draftPoll());

    await user.type(screen.getByLabelText('Poll Question'), ' Updated');
    await user.click(screen.getByRole('button', { name: /save as draft/i }));

    expect(updateExperienceBlock).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith('draft');
  });

  it('does not save an invalid edit', async () => {
    const user = userEvent.setup();
    const { onDone } = renderEditor(draftPoll());

    await user.clear(screen.getByLabelText('Poll Question'));
    await user.click(screen.getByRole('button', { name: /play/i }));

    expect(updateExperienceBlock).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
});
