import { MemoryRouter } from 'react-router-dom';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { TheScenePerformer } from '@cctv/types';

import { PerformerStoriesBar } from './PerformerStoriesBar';

const meta: Meta<typeof PerformerStoriesBar> = {
  title: 'Core/PerformerStoriesBar',
  component: PerformerStoriesBar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ background: 'var(--deep)', padding: '1rem' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PerformerStoriesBar>;

const withPhotos: TheScenePerformer[] = [
  {
    participant_id: '1',
    user_id: 'u1',
    name: 'Maya Carter',
    slug: 'maya-carter',
    photo_url: 'https://i.pravatar.cc/120?img=1',
    has_performer_profile: true,
  },
  {
    participant_id: '2',
    user_id: 'u2',
    name: 'Jordan Ali',
    slug: 'jordan-ali',
    photo_url: 'https://i.pravatar.cc/120?img=12',
    has_performer_profile: true,
  },
  {
    participant_id: '3',
    user_id: 'u3',
    name: 'Sam Pierce',
    slug: 'sam-pierce',
    photo_url: 'https://i.pravatar.cc/120?img=33',
    has_performer_profile: true,
  },
];

const withoutPhotos: TheScenePerformer[] = [
  {
    participant_id: '4',
    user_id: 'u4',
    name: 'Anna Vega',
    slug: null,
    photo_url: null,
    has_performer_profile: false,
  },
  {
    participant_id: '5',
    user_id: 'u5',
    name: 'Bobby T',
    slug: null,
    photo_url: null,
    has_performer_profile: false,
  },
];

export const WithPhotos: Story = {
  args: { performers: withPhotos },
};

export const WithInitialsFallback: Story = {
  args: { performers: withoutPhotos },
};

export const Mixed: Story = {
  args: { performers: [...withPhotos, ...withoutPhotos] },
};

export const Empty: Story = {
  args: { performers: [] },
};

export const Selectable: Story = {
  args: {
    performers: withPhotos,
    onSelect: (performer) => alert(`Selected ${performer.name}`),
  },
};
