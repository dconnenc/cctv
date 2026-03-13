import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../test-msw';
import { renderWithProviders } from '../../test-utils';
import Poll from './Poll';

describe('Poll', () => {
  const defaultProps = {
    question: 'What is your favorite color?',
    options: ['Red', 'Blue', 'Green'],
    pollType: 'single' as const,
    blockId: 'block-1',
  };

  it('renders form when user_responded is false', () => {
    renderWithProviders(<Poll {...defaultProps} responses={{ total: 0, user_responded: false }} />);

    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
    expect(screen.getByLabelText('Red')).toBeInTheDocument();
    expect(screen.getByLabelText('Blue')).toBeInTheDocument();
    expect(screen.getByLabelText('Green')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('shows submitted view when responses.user_responded is true', () => {
    renderWithProviders(
      <Poll
        {...defaultProps}
        responses={{
          total: 5,
          user_responded: true,
          user_response: {
            id: 'resp-1',
            answer: { selectedOptions: ['Red', 'Blue'] },
          },
        }}
      />,
    );

    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
    expect(screen.getByText('Red, Blue')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('shows submitting state while request is in flight', async () => {
    const user = userEvent.setup();

    let resolveResponse!: () => void;
    server.use(
      http.post('*/submit_poll_response', () => {
        return new Promise((resolve) => {
          resolveResponse = () => resolve(HttpResponse.json({ success: true }));
        });
      }),
    );

    renderWithProviders(<Poll {...defaultProps} responses={{ total: 0, user_responded: false }} />);

    await user.click(screen.getByLabelText('Red'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Submitting...')).toBeInTheDocument();

    resolveResponse();
  });

  it('shows error and returns to form on failed submission', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/submit_poll_response', () => {
        return HttpResponse.json({ success: false, error: 'Already responded' });
      }),
    );

    renderWithProviders(<Poll {...defaultProps} responses={{ total: 0, user_responded: false }} />);

    await user.click(screen.getByLabelText('Red'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText('Already responded')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('renders question only in monitor view', () => {
    renderWithProviders(
      <Poll
        {...defaultProps}
        viewContext="monitor"
        responses={{ total: 0, user_responded: false }}
      />,
    );

    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Red')).not.toBeInTheDocument();
  });
});
