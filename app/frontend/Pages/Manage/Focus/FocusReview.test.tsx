import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Block, PollBlock } from '@cctv/types';

import { participant, pollBlock } from '../testFactories';
import FocusReview from './FocusReview';

vi.mock('../BlockPreview/BlockPreview', () => ({
  default: ({ block }: { block: Block }) => <div>preview of {block.id}</div>,
}));

const participants = [
  participant({ id: 'p1', name: 'Nina' }),
  participant({ id: 'p2', name: 'Marcus' }),
];

function closedPoll(responses: PollBlock['responses'] = undefined): PollBlock {
  return pollBlock({
    status: 'closed',
    responses: responses ?? {
      total: 2,
      all_responses: [
        {
          id: 'r1',
          experience_participant_id: 'p1',
          answer: { value: 'Improv set' },
          created_at: '2026-08-07T22:34:25Z',
        },
        {
          id: 'r2',
          experience_participant_id: 'p2',
          answer: { value: 'Stand-up' },
          created_at: '2026-08-07T22:34:25Z',
        },
      ],
    },
  });
}

function renderReview(block: Block) {
  const onBack = vi.fn();
  render(<FocusReview block={block} participants={participants} onBack={onBack} />);
  return { onBack };
}

describe('FocusReview', () => {
  it('marks the activity as finished and names its kind', () => {
    renderReview(closedPoll());

    expect(screen.getByRole('heading', { name: 'Poll' })).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  it('offers no live controls', () => {
    renderReview(closedPoll());

    expect(screen.queryByRole('button', { name: /finish/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('lists the responses with who gave them', () => {
    renderReview(closedPoll());

    expect(screen.getByText('2 responses')).toBeInTheDocument();
    expect(screen.getByText(/Nina/)).toBeInTheDocument();
    expect(screen.getByText(/Marcus/)).toBeInTheDocument();
    expect(screen.getByText('Improv set')).toBeInTheDocument();
  });

  it('handles an activity that collected nothing', () => {
    renderReview(closedPoll({ total: 0, all_responses: [] }));

    expect(screen.getByText('0 responses')).toBeInTheDocument();
    expect(screen.getByText('No responses yet')).toBeInTheDocument();
  });

  it('calls onBack from the back button', async () => {
    const user = userEvent.setup();
    const { onBack } = renderReview(closedPoll());

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
