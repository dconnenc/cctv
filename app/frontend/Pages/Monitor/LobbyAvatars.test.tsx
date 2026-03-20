import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import LobbyAvatars from './LobbyAvatars';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

interface MockComponentProps {
  children?: ReactNode;
  opacity?: number;
  stroke?: string;
  [key: string]: unknown;
}

vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: MockComponentProps) => (
    <div data-testid="konva-stage" {...props}>
      {children}
    </div>
  ),
  Layer: ({ children }: MockComponentProps) => <div data-testid="konva-layer">{children}</div>,
  Group: ({ children, opacity, ...props }: MockComponentProps) => (
    <div data-testid="konva-group" data-opacity={opacity} {...props}>
      {children}
    </div>
  ),
  Line: ({ stroke, ...props }: MockComponentProps) => (
    <div data-testid="konva-line" data-stroke={stroke} {...props} />
  ),
}));

const mockMonitorView = vi.fn();
const mockDrawState = vi.fn();

vi.mock('@cctv/contexts/ExperienceContext', () => ({
  useExperience: () => ({ monitorView: mockMonitorView() }),
}));

vi.mock('@cctv/contexts/LobbyDrawingContext', () => ({
  useLobbyDrawingState: () => mockDrawState(),
}));

const now = new Date().toISOString();

const hostParticipant = {
  id: 'p1',
  user_id: 'u1',
  experience_id: 'exp1',
  name: 'Alice',
  email: 'alice@example.com',
  status: 'active' as const,
  role: 'host' as const,
  joined_at: now,
  fingerprint: null,
  created_at: now,
  updated_at: now,
};

const playerBob = {
  id: 'p2',
  user_id: 'u2',
  experience_id: 'exp1',
  name: 'Bob',
  email: 'bob@example.com',
  status: 'active' as const,
  role: 'player' as const,
  joined_at: now,
  fingerprint: null,
  created_at: now,
  updated_at: now,
};

const playerCharlie = {
  id: 'p3',
  user_id: 'u3',
  experience_id: 'exp1',
  name: 'Charlie',
  email: 'charlie@example.com',
  status: 'active' as const,
  role: 'player' as const,
  joined_at: now,
  fingerprint: null,
  created_at: now,
  updated_at: now,
};

const strokesForAll = {
  p1: [{ points: [10, 10, 20, 20], color: '#ff0000', width: 4 }],
  p2: [{ points: [30, 30, 40, 40], color: '#00ff00', width: 4 }],
  p3: [{ points: [50, 50, 60, 60], color: '#0000ff', width: 4 }],
};

function baseMonitorView(overrides = {}) {
  return {
    id: 'exp1',
    code: 'TEST',
    status: 'live',
    hosts: [hostParticipant],
    participants: [playerBob, playerCharlie],
    blocks: [],
    ...overrides,
  };
}

describe('LobbyAvatars', () => {
  it('renders all avatars at full opacity when no block is active', () => {
    mockMonitorView.mockReturnValue(baseMonitorView());
    mockDrawState.mockReturnValue({ strokes: strokesForAll });

    render(<LobbyAvatars />);

    // Render order: [...participants, ...hosts] = [Bob(p2), Charlie(p3), Alice(p1)]
    const groups = screen.getAllByTestId('konva-group');
    expect(groups).toHaveLength(3);
    groups.forEach((group) => {
      expect(group.dataset.opacity).toBe('1');
    });

    const lines = screen.getAllByTestId('konva-line');
    expect(lines[0].dataset.stroke).toBe('#00ff00'); // Bob
    expect(lines[1].dataset.stroke).toBe('#0000ff'); // Charlie
    expect(lines[2].dataset.stroke).toBe('#ff0000'); // Alice (host)
  });

  it('grays out non-responded players when a block is active', () => {
    mockMonitorView.mockReturnValue(
      baseMonitorView({
        blocks: [{ id: 'b1', kind: 'poll', status: 'open' }],
        responded_participant_ids: ['p2'],
      }),
    );
    mockDrawState.mockReturnValue({ strokes: strokesForAll });

    render(<LobbyAvatars />);

    const groups = screen.getAllByTestId('konva-group');
    const lines = screen.getAllByTestId('konva-line');

    // Bob (p2) — responded, full color
    expect(groups[0].dataset.opacity).toBe('1');
    expect(lines[0].dataset.stroke).toBe('#00ff00');

    // Charlie (p3) — not responded, grayed
    expect(groups[1].dataset.opacity).toBe('0.3');
    expect(lines[1].dataset.stroke).toBe('#666');

    // Host (p1) — never grayed
    expect(groups[2].dataset.opacity).toBe('1');
    expect(lines[2].dataset.stroke).toBe('#ff0000');
  });

  it('never grays out hosts even when they have no response', () => {
    mockMonitorView.mockReturnValue(
      baseMonitorView({
        blocks: [{ id: 'b1', kind: 'poll', status: 'open' }],
        responded_participant_ids: [],
      }),
    );
    mockDrawState.mockReturnValue({ strokes: strokesForAll });

    render(<LobbyAvatars />);

    const groups = screen.getAllByTestId('konva-group');

    // Bob — grayed (player, not responded)
    expect(groups[0].dataset.opacity).toBe('0.3');
    // Charlie — grayed (player, not responded)
    expect(groups[1].dataset.opacity).toBe('0.3');
    // Host stays full opacity
    expect(groups[2].dataset.opacity).toBe('1');
  });

  it('grays out avatars for participant-only blocks (participant_block_active)', () => {
    mockMonitorView.mockReturnValue(
      baseMonitorView({
        participant_block_active: true,
        responded_participant_ids: ['p3'],
      }),
    );
    mockDrawState.mockReturnValue({ strokes: strokesForAll });

    render(<LobbyAvatars />);

    const groups = screen.getAllByTestId('konva-group');
    const lines = screen.getAllByTestId('konva-line');

    // Bob — not responded, grayed
    expect(groups[0].dataset.opacity).toBe('0.3');
    expect(lines[0].dataset.stroke).toBe('#666');

    // Charlie — responded, full color
    expect(groups[1].dataset.opacity).toBe('1');
    expect(lines[1].dataset.stroke).toBe('#0000ff');

    // Host — never grayed
    expect(groups[2].dataset.opacity).toBe('1');
  });

  it('shows all avatars colorful when all players have responded', () => {
    mockMonitorView.mockReturnValue(
      baseMonitorView({
        blocks: [{ id: 'b1', kind: 'poll', status: 'open' }],
        responded_participant_ids: ['p2', 'p3'],
      }),
    );
    mockDrawState.mockReturnValue({ strokes: strokesForAll });

    render(<LobbyAvatars />);

    const groups = screen.getAllByTestId('konva-group');
    groups.forEach((group) => {
      expect(group.dataset.opacity).toBe('1');
    });

    const lines = screen.getAllByTestId('konva-line');
    expect(lines[0].dataset.stroke).toBe('#00ff00'); // Bob
    expect(lines[1].dataset.stroke).toBe('#0000ff'); // Charlie
    expect(lines[2].dataset.stroke).toBe('#ff0000'); // Alice (host)
  });

  it('skips participants without strokes', () => {
    mockMonitorView.mockReturnValue(baseMonitorView());
    mockDrawState.mockReturnValue({
      strokes: { p2: strokesForAll.p2 },
    });

    render(<LobbyAvatars />);

    const groups = screen.getAllByTestId('konva-group');
    expect(groups).toHaveLength(1);
  });
});
