import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BlockKind } from '@cctv/types';
import type { Block } from '@cctv/types';

import FocusStage from './FocusStage';

vi.mock('../BlockPreview/BlockPreview', () => ({
  default: ({ block }: { block: Block }) => <div>preview of {block.id}</div>,
}));

vi.mock('@cctv/pages/Block/FamilyFeudManager/FamilyFeudManager', () => ({
  default: () => <div>family feud controls</div>,
}));

vi.mock('@cctv/pages/Block/GuessWhoManager/GuessWhoManager', () => ({
  default: () => <div>guess who controls</div>,
}));

function openBlock(kind: BlockKind, total = 0, payload: Record<string, unknown> = {}): Block {
  return {
    id: 'block-1',
    kind,
    status: 'open',
    position: 0,
    payload,
    responses: { total },
  } as Block;
}

function renderStage(block: Block, props: Partial<{ isFinishing: boolean }> = {}) {
  const onFinish = vi.fn();
  render(<FocusStage block={block} isFinishing={props.isFinishing ?? false} onFinish={onFinish} />);
  return { onFinish };
}

describe('FocusStage', () => {
  it('marks the activity as live and names its kind', () => {
    renderStage(openBlock(BlockKind.POLL, 0, { question: 'Best opener?', options: [] }));

    expect(screen.getByRole('heading', { name: 'Poll' })).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('calls onFinish when Finish is pressed', async () => {
    const user = userEvent.setup();
    const { onFinish } = renderStage(
      openBlock(BlockKind.POLL, 3, { question: 'Best opener?', options: [] }),
    );

    await user.click(screen.getByRole('button', { name: /finish/i }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('shows the running response count', () => {
    renderStage(openBlock(BlockKind.POLL, 3, { question: 'Best opener?', options: [] }));

    expect(screen.getByText('3 responses')).toBeInTheDocument();
  });

  it('shows a reveal panel for Family Feud', () => {
    renderStage(openBlock(BlockKind.FAMILY_FEUD));

    expect(screen.getByText('Reveal')).toBeInTheDocument();
    expect(screen.getByText('family feud controls')).toBeInTheDocument();
  });

  it('shows a reveal panel for Guess Who', () => {
    renderStage(openBlock(BlockKind.GUESS_WHO));

    expect(screen.getByText('Reveal')).toBeInTheDocument();
    expect(screen.getByText('guess who controls')).toBeInTheDocument();
  });

  it('shows a waiting hint instead of a reveal panel for kinds without one', () => {
    renderStage(openBlock(BlockKind.POLL, 0, { question: 'Best opener?', options: [] }));

    expect(screen.queryByText('Reveal')).not.toBeInTheDocument();
    expect(screen.getByText(/responses are coming in/i)).toBeInTheDocument();
  });

  it('disables Finish while finishing', () => {
    renderStage(openBlock(BlockKind.POLL, 0, { question: 'Best opener?', options: [] }), {
      isFinishing: true,
    });

    expect(screen.getByRole('button', { name: /finishing/i })).toBeDisabled();
  });
});
