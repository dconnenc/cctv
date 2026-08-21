import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsErrorBoundary } from './AnalyticsErrorBoundary';

const { captureExceptionMock } = vi.hoisted(() => ({ captureExceptionMock: vi.fn() }));
vi.mock('./client', () => ({ captureException: captureExceptionMock }));

function Boom(): never {
  throw new Error('kaboom');
}

// React logs caught errors to console.error; silence it for these cases.
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  vi.clearAllMocks();
});

describe('AnalyticsErrorBoundary', () => {
  it('renders children and reports nothing when there is no error', () => {
    render(
      <AnalyticsErrorBoundary>
        <p>All good</p>
      </AnalyticsErrorBoundary>,
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('renders the fallback and reports the error when a child throws', () => {
    render(
      <AnalyticsErrorBoundary>
        <Boom />
      </AnalyticsErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const [error, properties] = captureExceptionMock.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('kaboom');
    expect(properties).toMatchObject({ source: 'react_error_boundary' });
  });

  it('renders a custom fallback when provided', () => {
    render(
      <AnalyticsErrorBoundary fallback={<p>Custom fallback</p>}>
        <Boom />
      </AnalyticsErrorBoundary>,
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('renders nothing when fallback is explicitly null', () => {
    const { container } = render(
      <AnalyticsErrorBoundary fallback={null}>
        <Boom />
      </AnalyticsErrorBoundary>,
    );

    expect(container.firstChild).toBeNull();
  });
});
