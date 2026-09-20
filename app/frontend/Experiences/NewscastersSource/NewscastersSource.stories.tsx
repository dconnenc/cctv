import type { Meta, StoryObj } from '@storybook/react-vite';

import NewscastersSource from './NewscastersSource';

const meta: Meta<typeof NewscastersSource> = {
  title: 'Experiences/NewscastersSource',
  component: NewscastersSource,
  tags: ['autodocs'],
  args: {
    blockId: 'demo-source',
    prompt: 'Send us your breaking news clip',
  },
};
export default meta;

type Story = StoryObj<typeof NewscastersSource>;

export const LinkOnly: Story = {
  args: {
    allowUpload: false,
  },
};

export const UploadEnabled: Story = {
  args: {
    allowUpload: true,
  },
};

export const MonitorView: Story = {
  args: {
    allowUpload: true,
    viewContext: 'monitor',
  },
};

export const ManageView: Story = {
  args: {
    allowUpload: true,
    viewContext: 'manage',
    responses: { total: 3 },
  },
};
