import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BlockKind } from '@cctv/types';
import type { Block } from '@cctv/types';

import FocusHistory from './FocusHistory';

function past(id: string, kind: BlockKind, question: string, total: number): Block {
  return {
    id,
    kind,
    status: 'closed',
    position: 0,
    payload: { question },
    responses: { total },
  } as Block;
}

describe('FocusHistory', () => {
  it('renders one row per finished activity', () => {
    render(
      <FocusHistory
        blocks={[
          past('b1', BlockKind.POLL, 'Best opener?', 4),
          past('b2', BlockKind.QUESTION, 'Worst advice?', 0),
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
        blocks={[
          past('b1', BlockKind.POLL, 'Many', 4),
          past('b2', BlockKind.POLL, 'One', 1),
          past('b3', BlockKind.POLL, 'None', 0),
        ]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('4 responses')).toBeInTheDocument();
    expect(screen.getByText('1 response')).toBeInTheDocument();
    expect(screen.getByText('0 responses')).toBeInTheDocument();
  });

  it('falls back to the kind label when a block has no text', () => {
    const block = {
      id: 'b1',
      kind: BlockKind.BUZZER,
      status: 'closed',
      position: 0,
      payload: {},
      responses: { total: 0 },
    } as Block;

    render(<FocusHistory blocks={[block]} onSelect={vi.fn()} />);

    expect(screen.getAllByText('Buzzer').length).toBeGreaterThan(0);
  });

  it('passes the chosen block to onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const block = past('b1', BlockKind.POLL, 'Best opener?', 4);

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
