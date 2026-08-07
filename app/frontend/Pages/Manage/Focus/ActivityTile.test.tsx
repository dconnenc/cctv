import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BlockKind } from '@cctv/types';

import {
  announcementBlock,
  blockOfKind,
  buzzerBlock,
  familyFeudBlock,
  minigameArithmeticBlock,
  pollBlock,
  questionBlock,
} from '../testFactories';
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
  it('reads a poll question', () => {
    expect(blockSummary(pollBlock({ payload: { question: 'Best opener?', options: [] } }))).toBe(
      'Best opener?',
    );
  });

  it('reads a question prompt', () => {
    expect(
      blockSummary(questionBlock({ payload: { question: 'Worst advice?', formKey: 'advice' } })),
    ).toBe('Worst advice?');
  });

  it('falls back to a Family Feud title', () => {
    expect(blockSummary(familyFeudBlock({ payload: { title: 'Green room things' } }))).toBe(
      'Green room things',
    );
  });

  it('falls back to a buzzer prompt', () => {
    expect(blockSummary(buzzerBlock({ payload: { prompt: 'Buzz to answer' } }))).toBe(
      'Buzz to answer',
    );
  });

  it('falls back to an announcement message', () => {
    expect(blockSummary(announcementBlock({ payload: { message: 'Phones out.' } }))).toBe(
      'Phones out.',
    );
  });

  it('prefers a buzzer prompt over its label', () => {
    expect(blockSummary(buzzerBlock({ payload: { label: 'Buzz', prompt: 'Name a city' } }))).toBe(
      'Name a city',
    );
    expect(blockSummary(buzzerBlock({ payload: { label: 'Buzz' } }))).toBe('Buzz');
  });

  it('trims what it returns and treats blank text as absent', () => {
    expect(
      blockSummary(pollBlock({ payload: { question: '  Best opener?  ', options: [] } })),
    ).toBe('Best opener?');
    expect(blockSummary(familyFeudBlock({ payload: { title: '   ' } }))).toBe('');
  });

  it('returns an empty string for kinds with no natural title', () => {
    expect(blockSummary(minigameArithmeticBlock())).toBe('');
  });

  it.each(Object.values(BlockKind))('returns a string for %s', (kind) => {
    expect(typeof blockSummary(blockOfKind(kind))).toBe('string');
  });
});
