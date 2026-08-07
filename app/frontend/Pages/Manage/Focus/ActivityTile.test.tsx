import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BlockKind } from '@cctv/types';
import type { Block } from '@cctv/types';

import { ActivityTile, blockSummary } from './ActivityTile';

describe('ActivityTile', () => {
  it('fires onClick when chosen', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ActivityTile kind={BlockKind.POLL} label="Poll" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: /poll/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows no draft badge for a plain kind tile', () => {
    render(<ActivityTile kind={BlockKind.POLL} label="Poll" onClick={vi.fn()} />);

    expect(screen.queryByText('Draft')).not.toBeInTheDocument();
  });

  it('badges drafts and names their kind', () => {
    render(
      <ActivityTile kind={BlockKind.QUESTION} label="Closing sketch?" isDraft onClick={vi.fn()} />,
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Question')).toBeInTheDocument();
  });

  it('renders a summary when given one', () => {
    render(
      <ActivityTile
        kind={BlockKind.POLL}
        label="Warm-up"
        summary="Which sketch should close?"
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Which sketch should close?')).toBeInTheDocument();
  });
});

describe('blockSummary', () => {
  function withPayload(payload: Record<string, unknown>): Block {
    return {
      id: 'b1',
      kind: BlockKind.POLL,
      status: 'hidden',
      position: 0,
      payload,
    } as unknown as Block;
  }

  it('prefers the question field', () => {
    expect(blockSummary(withPayload({ question: 'Best opener?', title: 'Ignored' }))).toBe(
      'Best opener?',
    );
  });

  it.each([
    ['title', 'A Title'],
    ['prompt', 'A Prompt'],
    ['message', 'A Message'],
    ['headline', 'A Headline'],
  ])('falls back to %s', (key, value) => {
    expect(blockSummary(withPayload({ [key]: value }))).toBe(value);
  });

  it('reads the first nested question when there is no top-level text', () => {
    expect(blockSummary(withPayload({ questions: [{ prompt: 'Name something' }] }))).toBe(
      'Name something',
    );
  });

  it('trims whitespace and ignores blank values', () => {
    expect(blockSummary(withPayload({ question: '   ', title: '  Real Title  ' }))).toBe(
      'Real Title',
    );
  });

  it('returns an empty string when nothing is usable', () => {
    expect(blockSummary(withPayload({ duration_seconds: 30 }))).toBe('');
  });
});
