import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeProvider } from '@cctv/contexts/ThemeContext';
import { DiscoverEvent, DiscoverTheater } from '@cctv/types';

import { ChicagoMap } from './ChicagoMap';

const theaters: DiscoverTheater[] = [
  {
    slug: 'second-city',
    name: 'The Second City',
    neighborhood: 'Old Town',
    lat: 41.9117,
    lng: -87.6347,
  },
  {
    slug: 'io-theater',
    name: 'iO Theater',
    neighborhood: 'Near North',
    lat: 41.9089,
    lng: -87.6529,
  },
  {
    slug: 'annoyance',
    name: 'The Annoyance Theatre',
    neighborhood: 'Lakeview',
    lat: 41.9396,
    lng: -87.6525,
  },
  {
    slug: 'the-den',
    name: 'The Den Theatre',
    neighborhood: 'Wicker Park',
    lat: 41.9068,
    lng: -87.6722,
  },
  {
    slug: 'laugh-factory',
    name: 'Laugh Factory Chicago',
    neighborhood: 'Lakeview',
    lat: 41.9403,
    lng: -87.6448,
  },
  {
    slug: 'comedy-bar',
    name: 'Comedy Bar',
    neighborhood: 'River North',
    lat: 41.8907,
    lng: -87.6324,
  },
];

const event = (id: string, theater_slug: string, is_live = false): DiscoverEvent => ({
  id,
  title: `Show ${id}`,
  starts_at: '2026-06-11T19:00:00',
  ends_at: '2026-06-11T21:00:00',
  venue_name: theater_slug,
  venue_address: null,
  pricing_text: null,
  ticket_url: 'https://example.com/tickets',
  slug: `show-${id}`,
  performers: [],
  theater_slug,
  is_live,
});

const events: DiscoverEvent[] = [
  event('1', 'the-den', true),
  event('2', 'second-city'),
  event('3', 'laugh-factory'),
];

const meta: Meta<typeof ChicagoMap> = {
  title: 'Discover/ChicagoMap',
  component: ChicagoMap,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
    // Leaflet needs an explicitly sized container to mount into. Tiles require
    // network access, so the basemap is blank offline — markers still render.
    (Story) => (
      <div style={{ width: '900px', height: '640px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    theaters,
    onSelectTheater: () => {},
    onHoverTheater: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof ChicagoMap>;

export const Populated: Story = {
  args: { events, focusedTheaterSlug: 'the-den', highlightedTheaterSlug: null },
};

export const HighlightedTheater: Story = {
  args: { events, focusedTheaterSlug: 'the-den', highlightedTheaterSlug: 'second-city' },
};

export const Empty: Story = {
  args: { events: [], focusedTheaterSlug: null, highlightedTheaterSlug: null },
};
