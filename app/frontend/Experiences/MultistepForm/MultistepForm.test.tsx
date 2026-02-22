import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../test-msw';
import { renderWithProviders } from '../../test-utils';
import MultistepForm from './MultistepForm';

describe('MultistepForm', () => {
  const defaultProps = {
    questions: [
      { question: 'First name?', formKey: 'firstName', inputType: 'text' as const },
      { question: 'Last name?', formKey: 'lastName', inputType: 'text' as const },
    ],
    blockId: 'block-1',
  };

  it('shows form with first question visible', () => {
    renderWithProviders(
      <MultistepForm {...defaultProps} responses={{ total: 0, user_responded: false }} />,
    );

    expect(screen.getByLabelText('First name?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('shows submitted view from responses', () => {
    renderWithProviders(
      <MultistepForm
        {...defaultProps}
        responses={{
          total: 2,
          user_responded: true,
          user_response: {
            id: 'resp-1',
            answer: { responses: { firstName: 'Alice', lastName: 'Smith' } },
          },
        }}
      />,
    );

    expect(screen.getByText('First name?')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Last name?')).toBeInTheDocument();
    expect(screen.getByText('Smith')).toBeInTheDocument();
  });

  it('navigates between steps', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MultistepForm {...defaultProps} responses={{ total: 0, user_responded: false }} />,
    );

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('shows submitting state while request is in flight', async () => {
    const user = userEvent.setup();

    let resolveResponse!: () => void;
    server.use(
      http.post('*/submit_multistep_form_response', () => {
        return new Promise((resolve) => {
          resolveResponse = () => resolve(HttpResponse.json({ success: true }));
        });
      }),
    );

    const { container } = renderWithProviders(
      <MultistepForm {...defaultProps} responses={{ total: 0, user_responded: false }} />,
    );

    const firstInput = container.querySelector('input[name="firstName"]') as HTMLInputElement;
    const lastInput = container.querySelector('input[name="lastName"]') as HTMLInputElement;

    fireEvent.change(firstInput, { target: { value: 'Alice' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(lastInput, { target: { value: 'Smith' } });
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Submitting...')).toBeInTheDocument();

    resolveResponse();
  });
});
