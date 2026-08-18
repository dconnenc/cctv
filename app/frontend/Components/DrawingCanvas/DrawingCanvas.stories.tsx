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
    onCosmeticsChange: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof DrawingCanvas>;

export const Empty: Story = {};

export const BackgroundMode: Story = {
  args: {
    mode: 'background',
    initialStrokes: [
      { points: [90, 120, 150, 120, 150, 180, 90, 180, 90, 120], color: '#080808', width: 4 },
    ],
  },
};

export const WithCosmetic: Story = {
  args: {
    mode: 'decorate',
    initialStrokes: [
      { points: [80, 120, 160, 120, 160, 200, 80, 200, 80, 120], color: '#c8f060', width: 4 },
    ],
    cosmetics: [
      {
        cosmetic_id: 'hat-1',
        slug: 'top-hat',
        asset_key: 'hat',
        category: 'clothing',
        x: 100,
        y: 60,
        width: 120,
        height: 96,
        rotation: 0,
      },
    ],
  },
};

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
