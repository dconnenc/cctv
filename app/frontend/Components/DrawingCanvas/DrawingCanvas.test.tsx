import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import DrawingCanvas from './DrawingCanvas';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

interface MockComponentProps {
  children?: ReactNode;
  [key: string]: unknown;
}

vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: MockComponentProps) => (
    <div data-testid="konva-stage" {...props}>
      {children}
    </div>
  ),
  Layer: ({ children }: MockComponentProps) => <div data-testid="konva-layer">{children}</div>,
  Line: ({ stroke, ...props }: MockComponentProps) => (
    <div data-testid="konva-line" data-stroke={stroke} {...props} />
  ),
}));

describe('DrawingCanvas', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
  };

  it('renders canvas, toolbar, and control buttons', () => {
    render(<DrawingCanvas {...defaultProps} />);

    expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('renders brush size buttons', () => {
    render(<DrawingCanvas {...defaultProps} />);

    expect(screen.getByText('Thin')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Thick')).toBeInTheDocument();
    expect(screen.getByText('Huge')).toBeInTheDocument();
  });

  it('disables Submit when no strokes are drawn', () => {
    render(<DrawingCanvas {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('disables Undo when no uncommitted strokes exist', () => {
    render(<DrawingCanvas {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('disables Undo when all strokes are committed', () => {
    const committedStrokes = [
      { points: [10, 10, 20, 20], color: '#ff0000', width: 4, committed: true },
    ];

    render(<DrawingCanvas {...defaultProps} initialStrokes={committedStrokes} />);

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByTestId('konva-line')).toBeInTheDocument();
  });

  it('enables Undo when uncommitted strokes exist', () => {
    const mixedStrokes = [
      { points: [10, 10, 20, 20], color: '#ff0000', width: 4, committed: true },
      { points: [30, 30, 40, 40], color: '#00ff00', width: 4 },
    ];

    render(<DrawingCanvas {...defaultProps} initialStrokes={mixedStrokes} />);

    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  it('removes last uncommitted stroke on Undo click', async () => {
    const user = userEvent.setup();
    const onStrokeEvent = vi.fn();
    const strokes = [
      { points: [10, 10, 20, 20], color: '#ff0000', width: 4, committed: true },
      { points: [30, 30, 40, 40], color: '#00ff00', width: 4 },
    ];

    render(
      <DrawingCanvas {...defaultProps} initialStrokes={strokes} onStrokeEvent={onStrokeEvent} />,
    );

    expect(screen.getAllByTestId('konva-line')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getAllByTestId('konva-line')).toHaveLength(1);
    expect(onStrokeEvent).toHaveBeenCalledWith({ operation: 'stroke_undone' });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('does not remove committed strokes on Undo', () => {
    const strokes = [{ points: [10, 10, 20, 20], color: '#ff0000', width: 4, committed: true }];

    render(<DrawingCanvas {...defaultProps} initialStrokes={strokes} />);

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getAllByTestId('konva-line')).toHaveLength(1);
  });

  it('clears all strokes on Clear click', async () => {
    const user = userEvent.setup();
    const onStrokeEvent = vi.fn();
    const strokes = [
      { points: [10, 10, 20, 20], color: '#ff0000', width: 4, committed: true },
      { points: [30, 30, 40, 40], color: '#00ff00', width: 4 },
    ];

    render(
      <DrawingCanvas {...defaultProps} initialStrokes={strokes} onStrokeEvent={onStrokeEvent} />,
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByTestId('konva-line')).not.toBeInTheDocument();
    expect(onStrokeEvent).toHaveBeenCalledWith({ operation: 'canvas_cleared' });
  });

  it('calls onSubmit with committed strokes on Submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const strokes = [{ points: [10, 10, 20, 20], color: '#ff0000', width: 4 }];

    render(<DrawingCanvas onSubmit={onSubmit} initialStrokes={strokes} />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith([
      { points: [10, 10, 20, 20], color: '#ff0000', width: 4, committed: true },
    ]);
  });

  it('shows Save button instead of Submit when onBack is provided', () => {
    render(<DrawingCanvas {...defaultProps} onBack={() => {}} />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('calls onSubmit with committed strokes and onBack on Save', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onBack = vi.fn();
    const strokes = [{ points: [10, 10, 20, 20], color: '#ff0000', width: 4 }];

    render(<DrawingCanvas onSubmit={onSubmit} onBack={onBack} initialStrokes={strokes} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledWith([
      { points: [10, 10, 20, 20], color: '#ff0000', width: 4, committed: true },
    ]);
    expect(onBack).toHaveBeenCalled();
  });

  it('restores strokes on Undo after Clear', async () => {
    const user = userEvent.setup();
    const onStrokeEvent = vi.fn();
    const strokes = [
      { points: [10, 10, 20, 20], color: '#ff0000', width: 4 },
      { points: [30, 30, 40, 40], color: '#00ff00', width: 4 },
    ];

    render(
      <DrawingCanvas {...defaultProps} initialStrokes={strokes} onStrokeEvent={onStrokeEvent} />,
    );

    expect(screen.getAllByTestId('konva-line')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByTestId('konva-line')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getAllByTestId('konva-line')).toHaveLength(2);
    expect(onStrokeEvent).toHaveBeenCalledWith({
      operation: 'canvas_clear_undone',
      data: { strokes },
    });
  });

  it('renders initial strokes as lines', () => {
    const strokes = [
      { points: [10, 10, 20, 20], color: '#ff0000', width: 4 },
      { points: [30, 30, 40, 40], color: '#00ff00', width: 2 },
    ];

    render(<DrawingCanvas {...defaultProps} initialStrokes={strokes} />);

    const lines = screen.getAllByTestId('konva-line');
    expect(lines).toHaveLength(2);
    expect(lines[0].dataset.stroke).toBe('#ff0000');
    expect(lines[1].dataset.stroke).toBe('#00ff00');
  });
});
