import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from '@cctv/components/ui/switch';

const meta: Meta<typeof Switch> = {
  title: 'Core/Switch',
  component: Switch,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const WithIcons: Story = {
  args: { withIcons: true, defaultChecked: true },
};

export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Switch id="notifications" checked={checked} onCheckedChange={setChecked} />
        <label htmlFor="notifications" style={{ cursor: 'pointer' }}>
          Enable notifications
        </label>
      </div>
    );
  },
};
