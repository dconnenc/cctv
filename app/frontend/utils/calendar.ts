import { CalendarEvent } from '@cctv/types';

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const formatDate = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.starts_at)}/${formatDate(event.ends_at)}`,
  });

  const location = [event.venue_name, event.venue_address].filter(Boolean).join(', ');
  if (location) params.set('location', location);
  if (event.description) params.set('details', event.description);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatEventDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dateKey = new Date(event.starts_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  }

  return grouped;
}
