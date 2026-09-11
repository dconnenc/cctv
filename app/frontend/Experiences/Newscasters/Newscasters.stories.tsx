import type { Meta, StoryObj } from '@storybook/react-vite';

import { BlockKind, NewscastersBlock } from '@cctv/types';

import Newscasters from './Newscasters';

const baseBlock: NewscastersBlock = {
  id: 'demo-newscasters',
  kind: BlockKind.NEWSCASTERS,
  status: 'open',
  position: 0,
  payload: {
    playing: true,
    restart_count: 0,
    source_block_id: 'demo-source',
    selected_video: null,
  },
};

const withVideo = (overrides: Partial<NewscastersBlock['payload']>): NewscastersBlock => ({
  ...baseBlock,
  payload: { ...baseBlock.payload, ...overrides },
});

const meta: Meta<typeof Newscasters> = {
  title: 'Experiences/Newscasters',
  component: Newscasters,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Newscasters>;

export const MonitorUploadPlaying: Story = {
  args: {
    viewContext: 'monitor',
    block: withVideo({
      playing: true,
      selected_video: {
        kind: 'upload',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        submission_id: 's1',
      },
    }),
  },
};

export const MonitorYoutube: Story = {
  args: {
    viewContext: 'monitor',
    block: withVideo({
      playing: true,
      selected_video: {
        kind: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        submission_id: 's2',
      },
    }),
  },
};

export const MonitorNoSelection: Story = {
  args: {
    viewContext: 'monitor',
    block: withVideo({ playing: false, selected_video: null }),
  },
};

export const Participant: Story = {
  args: {
    viewContext: 'participant',
    block: baseBlock,
  },
};

export const Manage: Story = {
  args: {
    viewContext: 'manage',
    block: withVideo({
      playing: false,
      selected_video: { kind: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ', submission_id: 's2' },
    }),
  },
};
