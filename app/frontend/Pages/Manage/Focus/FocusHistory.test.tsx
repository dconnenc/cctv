import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Block } from '@cctv/types';

import { buzzerBlock, pollBlock, questionBlock } from '../testFactories';
import FocusHistory from './FocusHistory';

function pastPoll(id: string, question: string, total: number): Block {
  return pollBlock({
    id,
    status: 'closed',
    payload: { question, options: [] },
    responses: { total },
  });
}

describe('FocusHistory', () => {
  it('renders one row per finished activity', () => {
    render(
      <FocusHistory
        blocks={[
          pastPoll('b1', 'Best opener?', 4),
          questionBlock({
            id: 'b2',
            status: 'closed',
            payload: { question: 'Worst advice?', formKey: 'advice' },
          }),
        ]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText('Best opener?')).toBeInTheDocument();
    expect(screen.getByText('Worst advice?')).toBeInTheDocument();
  });

  it('pluralises the response count', () => {
    render(
      <FocusHistory
        blocks={[pastPoll('b1', 'Many', 4), pastPoll('b2', 'One', 1), pastPoll('b3', 'None', 0)]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('4 responses')).toBeInTheDocument();
    expect(screen.getByText('1 response')).toBeInTheDocument();
    expect(screen.getByText('0 responses')).toBeInTheDocument();
  });

  it('falls back to the kind label when a block has no text', () => {
    const block = buzzerBlock({ status: 'closed', payload: {}, responses: { total: 0 } });

    render(<FocusHistory blocks={[block]} onSelect={vi.fn()} />);

    expect(screen.getAllByText('Buzzer').length).toBeGreaterThan(0);
  });

  it('passes the chosen block to onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const block = pastPoll('b1', 'Best opener?', 4);

    render(<FocusHistory blocks={[block]} onSelect={onSelect} />);
    await user.click(screen.getByText('Best opener?'));

    expect(onSelect).toHaveBeenCalledWith(block);
  });

  it('shows an empty state with nothing to list', () => {
    render(<FocusHistory blocks={[]} onSelect={vi.fn()} />);

    expect(screen.getByText('Nothing has run yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
