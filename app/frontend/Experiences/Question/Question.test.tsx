import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../test-msw';
import { renderWithProviders } from '../../test-utils';
import Question from './Question';

describe('Question', () => {
  const defaultProps = {
    question: 'What is your name?',
    formKey: 'name',
    inputType: 'text' as const,
    blockId: 'block-1',
  };

  it('renders form when user_responded is false', () => {
    renderWithProviders(
      <Question {...defaultProps} responses={{ total: 0, user_responded: false }} />,
    );

    expect(screen.getByText('What is your name?')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('shows submitted view when responses.user_responded is true', () => {
    renderWithProviders(
      <Question
        {...defaultProps}
        responses={{
          total: 3,
          user_responded: true,
          user_response: {
            id: 'resp-1',
            answer: { value: 'Alice' },
          },
        }}
      />,
    );

    expect(screen.getByText('What is your name?')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows submitting state while request is in flight', async () => {
    const user = userEvent.setup();

    let resolveResponse!: () => void;
    server.use(
      http.post('*/submit_question_response', () => {
        return new Promise((resolve) => {
          resolveResponse = () => resolve(HttpResponse.json({ success: true }));
        });
      }),
    );

    renderWithProviders(
      <Question {...defaultProps} responses={{ total: 0, user_responded: false }} />,
    );

    await user.type(screen.getByRole('textbox'), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Submitting...')).toBeInTheDocument();

    resolveResponse();
  });

  it('shows error on failed submission', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/submit_question_response', () => {
        return HttpResponse.json({ success: false, error: 'Server error' });
      }),
    );

    renderWithProviders(
      <Question {...defaultProps} responses={{ total: 0, user_responded: false }} />,
    );

    await user.type(screen.getByRole('textbox'), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('resets isSubmitting when blockId changes', async () => {
    const user = userEvent.setup();

    let resolveResponse!: () => void;
    server.use(
      http.post('*/submit_question_response', () => {
        return new Promise((resolve) => {
          resolveResponse = () => resolve(HttpResponse.json({ success: true }));
        });
      }),
    );

    const { rerender } = renderWithProviders(
      <Question {...defaultProps} responses={{ total: 0, user_responded: false }} />,
    );

    await user.type(screen.getByRole('textbox'), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Submitting...')).toBeInTheDocument();

    rerender(
      <Question
        {...defaultProps}
        blockId="block-2"
        responses={{ total: 0, user_responded: false }}
      />,
    );

    expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();

    resolveResponse();
  });

  it('renders question only in monitor view', () => {
    renderWithProviders(
      <Question
        {...defaultProps}
        viewContext="monitor"
        responses={{ total: 0, user_responded: false }}
      />,
    );

    expect(screen.getByText('What is your name?')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
