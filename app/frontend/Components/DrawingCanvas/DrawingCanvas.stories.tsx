import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import DrawingCanvas from './DrawingCanvas';

const meta: Meta<typeof DrawingCanvas> = {
  title: 'Components/DrawingCanvas',
  component: DrawingCanvas,
  tags: ['autodocs'],
  args: {
    onSubmit: fn(),
    onStrokeEvent: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof DrawingCanvas>;

export const Empty: Story = {};

export const WithInitialStrokes: Story = {
  args: {
    initialStrokes: [
      { points: [80, 60, 160, 60, 160, 140, 80, 140, 80, 60], color: '#c8f060', width: 4 },
      { points: [100, 90, 120, 80, 140, 90], color: '#ff4911', width: 3 },
      { points: [110, 110, 130, 120], color: '#c8f060', width: 2 },
    ],
  },
};

export const WithCommittedStrokes: Story = {
  args: {
    initialStrokes: [
      {
        points: [80, 60, 160, 60, 160, 140, 80, 140, 80, 60],
        color: '#c8f060',
        width: 4,
        committed: true,
      },
      { points: [100, 90, 120, 80, 140, 90], color: '#ff4911', width: 3, committed: true },
    ],
  },
};

export const MixedCommittedAndUncommitted: Story = {
  args: {
    initialStrokes: [
      {
        points: [80, 60, 160, 60, 160, 140, 80, 140, 80, 60],
        color: '#c8f060',
        width: 4,
        committed: true,
      },
      { points: [100, 90, 120, 80, 140, 90], color: '#ff4911', width: 3 },
    ],
  },
};

export const EditMode: Story = {
  args: {
    initialStrokes: [
      {
        points: [80, 60, 160, 60, 160, 140, 80, 140, 80, 60],
        color: '#c8f060',
        width: 4,
        committed: true,
      },
    ],
    onBack: fn(),
  },
};
