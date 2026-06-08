import type { Meta, StoryObj } from '@storybook/react-vite';

import { DiscoverEvent } from '@cctv/types';

import { ShowCard } from './ShowCard';

const baseEvent: DiscoverEvent = {
  id: '1',
  title: 'Improv All-Stars Showcase',
  starts_at: '2026-06-11T19:00:00',
  ends_at: '2026-06-11T21:00:00',
  venue_name: 'The Den Theatre',
  venue_address: '1331 N Milwaukee Ave',
  pricing_text: '$15',
  ticket_url: 'https://example.com/tickets',
  slug: 'improv-all-stars',
  performers: [],
  theater_slug: 'the-den',
  is_live: false,
};

const meta: Meta<typeof ShowCard> = {
  title: 'Discover/ShowCard',
  component: ShowCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '28rem' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ShowCard>;

export const Featured: Story = {
  args: { event: baseEvent, variant: 'featured', neighborhood: 'Wicker Park' },
};

export const FeaturedLive: Story = {
  args: {
    event: { ...baseEvent, is_live: true },
    variant: 'featured',
    neighborhood: 'Wicker Park',
  },
};

export const FeaturedNoTickets: Story = {
  args: {
    event: { ...baseEvent, ticket_url: null, pricing_text: null },
    variant: 'featured',
    neighborhood: 'Wicker Park',
  },
};

export const Compact: Story = {
  args: { event: baseEvent, variant: 'compact', neighborhood: 'Wicker Park' },
};

export const CompactHighlighted: Story = {
  args: {
    event: baseEvent,
    variant: 'compact',
    neighborhood: 'Wicker Park',
    isHighlighted: true,
  },
};
