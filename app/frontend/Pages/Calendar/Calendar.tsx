import { useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

import { useEvents } from '@cctv/hooks';
import { CalendarEvent } from '@cctv/types';
import { formatEventTime, groupEventsByDate } from '@cctv/utils/calendar';

import styles from './Calendar.module.scss';

export default function Calendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { events, isLoading } = useEvents({ month, year });

  const grouped = useMemo(() => groupEventsByDate(events), [events]);

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <section className="page">
      <div className={styles.calendar}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <CalendarDays size={24} />
            Events
          </h1>
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={20} />
            </button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading events...</div>
        ) : events.length === 0 ? (
          <div className={styles.empty}>No events this month</div>
        ) : (
          <div className={styles.eventList}>
            {Array.from(grouped.entries()).map(
              ([dateLabel, dayEvents]: [string, CalendarEvent[]]) => (
                <div key={dateLabel} className={styles.dateGroup}>
                  <h2 className={styles.dateLabel}>{dateLabel}</h2>
                  <div className={styles.dateEvents}>
                    {dayEvents.map((event: CalendarEvent) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <Link to={`/events/${event.slug}`} className={styles.eventCard}>
      <div className={styles.eventTime}>{formatEventTime(event.starts_at)}</div>
      <div className={styles.eventInfo}>
        <h3 className={styles.eventTitle}>{event.title}</h3>
        {event.venue_name && (
          <span className={styles.eventVenue}>
            <MapPin size={14} />
            {event.venue_name}
          </span>
        )}
        {event.performers.length > 0 && (
          <span className={styles.eventPerformers}>
            {event.performers.map((p) => p.name).join(', ')}
          </span>
        )}
        {event.pricing_text && <span className={styles.eventPricing}>{event.pricing_text}</span>}
      </div>
      {event.experience?.active && <span className={styles.liveBadge}>LIVE</span>}
    </Link>
  );
}
