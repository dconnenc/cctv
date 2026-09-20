import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DiscoverEvent, DiscoverTheater } from '@cctv/types';

import { ChicagoMap } from './ChicagoMap';

const theaters: DiscoverTheater[] = [
  {
    slug: 'annoyance',
    name: 'The Annoyance Theatre',
    neighborhood: 'Lakeview',
    lat: 41.9396,
    lng: -87.6525,
  },
  {
    slug: 'comedy-bar',
    name: 'Comedy Bar',
    neighborhood: 'River North',
    lat: 41.8907,
    lng: -87.6324,
  },
];

const events: DiscoverEvent[] = [
  {
    id: '1',
    title: 'Messing With A Friend',
    starts_at: '2026-06-11T19:00:00',
    ends_at: '2026-06-11T21:00:00',
    venue_name: 'The Annoyance Theatre',
    venue_address: null,
    pricing_text: null,
    ticket_url: 'https://example.com/tickets',
    slug: 'messing-with-a-friend',
    performers: [],
    theater_slug: 'annoyance',
    is_live: false,
  },
];

function renderMap(props: Partial<React.ComponentProps<typeof ChicagoMap>> = {}) {
  const onSelectTheater = vi.fn();
  const onHoverTheater = vi.fn();
  render(
    <MemoryRouter>
      <ChicagoMap
        theaters={theaters}
        events={events}
        focusedTheaterSlug={null}
        highlightedTheaterSlug={null}
        onSelectTheater={onSelectTheater}
        onHoverTheater={onHoverTheater}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onSelectTheater, onHoverTheater };
}

function markerTop(name: string): number {
  const marker = screen.getByRole('button', { name }).closest('div');
  return Number.parseFloat(marker instanceof HTMLElement ? marker.style.top : '');
}

describe('ChicagoMap', () => {
  it('renders a labelled marker for every theater', () => {
    renderMap();

    expect(
      screen.getByRole('button', { name: 'The Annoyance Theatre, Lakeview' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Comedy Bar, River North' })).toBeInTheDocument();
  });

  it('places northern theaters above southern ones', () => {
    renderMap();

    expect(markerTop('The Annoyance Theatre, Lakeview')).toBeLessThan(
      markerTop('Comedy Bar, River North'),
    );
  });

  it('opens a popup with the theater shows on hover', async () => {
    const user = userEvent.setup();
    const { onHoverTheater } = renderMap();

    await user.hover(screen.getByRole('button', { name: 'The Annoyance Theatre, Lakeview' }));

    expect(screen.getByText('Messing With A Friend')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Get tickets for Messing With A Friend' }),
    ).toHaveAttribute('href', 'https://example.com/tickets');
    expect(onHoverTheater).toHaveBeenCalledWith('annoyance');
  });

  it('tells a theater with no upcoming shows apart', async () => {
    const user = userEvent.setup();
    renderMap();

    await user.hover(screen.getByRole('button', { name: 'Comedy Bar, River North' }));

    expect(screen.getByText('No upcoming shows')).toBeInTheDocument();
  });

  it('selects a theater when its marker is clicked', async () => {
    const user = userEvent.setup();
    const { onSelectTheater } = renderMap();

    await user.click(screen.getByRole('button', { name: 'Comedy Bar, River North' }));

    expect(onSelectTheater).toHaveBeenCalledWith('comedy-bar');
  });
});
