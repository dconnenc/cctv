import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { GlassCaseButton } from './GlassCaseButton';

const meta: Meta<typeof GlassCaseButton> = {
  title: 'Core/GlassCaseButton',
  component: GlassCaseButton,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof GlassCaseButton>;

export const Locked: Story = {
  args: {
    locked: true,
    lockedLabel: 'WAITING',
    onPress: () => undefined,
  },
};

export const Armed: Story = {
  args: {
    locked: false,
    label: 'BREAK GLASS',
    onPress: () => alert('Buzzer pressed!'),
    onBreak: () => undefined,
  },
};

export const Interactive: Story = {
  render: function Interactive() {
    const [pressedAt, setPressedAt] = useState<string | null>(null);
    const [brokeAt, setBrokeAt] = useState<string | null>(null);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
        <GlassCaseButton
          locked={false}
          onBreak={() => setBrokeAt(new Date().toLocaleTimeString())}
          onPress={() => setPressedAt(new Date().toLocaleTimeString())}
        />
        <div style={{ fontFamily: 'var(--font-body)', color: 'var(--hot-white)' }}>
          <div>Glass broken at: {brokeAt ?? '—'}</div>
          <div>Buzzer pressed at: {pressedAt ?? '—'}</div>
        </div>
      </div>
    );
  },
};

export const LargeSize: Story = {
  args: {
    locked: false,
    size: 380,
    onPress: () => undefined,
  },
};

// Toggle the lock to see the arm-up transition: the rim light ramps to red,
// the dome powers on, a glint sweeps the glass, and a ready chime plays.
export const ArmTransition: Story = {
  render: function ArmTransition() {
    const [locked, setLocked] = useState(true);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
        <GlassCaseButton
          locked={locked}
          lockedLabel="LOCKED"
          onBreak={() => undefined}
          onPress={() => undefined}
        />
        <button
          type="button"
          onClick={() => setLocked((l) => !l)}
          style={{ fontFamily: 'var(--font-body)', padding: '0.5rem 1rem' }}
        >
          {locked ? 'Arm buzzer' : 'Lock buzzer'}
        </button>
      </div>
    );
  },
};
