import { Link } from 'react-router-dom';

import classNames from 'classnames';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { motion } from 'motion/react';

import { Button, Panel } from '@cctv/core';
import { DiscoverEvent } from '@cctv/types';
import { formatEventDate, formatEventDateFull } from '@cctv/utils/calendar';

import styles from './ShowCard.module.scss';

interface ShowCardProps {
  event: DiscoverEvent;
  variant: 'featured' | 'compact';
  neighborhood?: string;
  isHighlighted?: boolean;
  onSelect?: () => void;
  onHover?: (hovering: boolean) => void;
}

export function ShowCard({
  event,
  variant,
  neighborhood,
  isHighlighted,
  onSelect,
  onHover,
}: ShowCardProps) {
  const venueLabel = [event.venue_name, neighborhood].filter(Boolean).join(' · ');

  if (variant === 'compact') {
    return (
      <motion.button
        type="button"
        layout
        layoutId={event.id}
        className={classNames(styles.compact, { [styles.highlighted]: isHighlighted })}
        onClick={onSelect}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      >
        <span className={styles.compactDate}>{formatEventDate(event.starts_at)}</span>
        <span className={styles.compactTitle}>{event.title}</span>
        {venueLabel && <span className={styles.compactVenue}>{venueLabel}</span>}
        {event.is_live && (
          <span className={styles.liveTag}>
            <span className={styles.liveDot} aria-hidden="true" />
            Live
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      layout
      layoutId={event.id}
      className={classNames(styles.featuredWrap, { [styles.highlighted]: isHighlighted })}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <Panel className={styles.featuredPanel}>
        {event.is_live && (
          <span className={styles.liveBadge}>
            <span className={styles.liveDot} aria-hidden="true" />
            Live now
          </span>
        )}

        <Link to={`/events/${event.slug}`} className={styles.titleLink}>
          <h3 className={styles.featuredTitle}>{event.title}</h3>
        </Link>

        <div className={styles.metaList}>
          <span className={styles.meta}>
            <CalendarDays size={16} />
            {formatEventDateFull(event.starts_at)}
          </span>
          {venueLabel && (
            <span className={styles.meta}>
              <MapPin size={16} />
              {venueLabel}
            </span>
          )}
        </div>

        <div className={styles.actions}>
          {event.ticket_url && (
            <Button
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              icon={<Ticket size={16} />}
              size="lg"
            >
              {event.pricing_text ? `Get Tickets · ${event.pricing_text}` : 'Get Tickets'}
            </Button>
          )}
          <Button to={`/events/${event.slug}`} variant="ghost">
            Details
          </Button>
        </div>
      </Panel>
    </motion.div>
  );
}
