import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import { Link } from 'react-router-dom';

import classNames from 'classnames';
import { ArrowRight, Ticket } from 'lucide-react';

import { DiscoverEvent, DiscoverTheater } from '@cctv/types';
import { formatEventDate } from '@cctv/utils/calendar';

import {
  ARTERIAL_PATH,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  PARK_PATH,
  RIVER_PATH,
  STREET_PATH,
  WATER_PATH,
} from './chicago-geometry';
import { projectToFrame } from './projection';

import styles from './ChicagoMap.module.scss';

// Centred toward the shoreline so, full-bleed, the venues sit left-of-centre and
// Lake Michigan fills the right of the screen (behind the rail).
const CENTER_LAT = 41.915;
const CENTER_LNG = -87.655;
const POPUP_CLOSE_DELAY = 15000;

const CENTER = projectToFrame(CENTER_LAT, CENTER_LNG);

// The basemap and the marker layer are both the full baked frame, pinned so the
// map centre lands on the container's centre. No measuring, no reflow on resize.
const FRAME_STYLE = {
  width: `${FRAME_WIDTH}px`,
  height: `${FRAME_HEIGHT}px`,
  marginLeft: `${-CENTER.x}px`,
  marginTop: `${-CENTER.y}px`,
} satisfies CSSProperties;

function Basemap() {
  return (
    <svg
      className={styles.basemap}
      style={FRAME_STYLE}
      width={FRAME_WIDTH}
      height={FRAME_HEIGHT}
      aria-hidden="true"
      focusable="false"
    >
      <path className={styles.water} d={WATER_PATH} />
      <path className={styles.park} d={PARK_PATH} />
      <path className={styles.river} d={RIVER_PATH} />
      <path className={styles.street} d={STREET_PATH} />
      <path className={styles.arterial} d={ARTERIAL_PATH} />
    </svg>
  );
}

interface TheaterMarkerProps {
  theater: DiscoverTheater;
  shows: DiscoverEvent[];
  isFocused: boolean;
  isHighlighted: boolean;
  isOpen: boolean;
  onSelectTheater: (slug: string) => void;
  onOpen: (slug: string) => void;
  onScheduleClose: () => void;
  onCancelClose: () => void;
}

function TheaterMarker({
  theater,
  shows,
  isFocused,
  isHighlighted,
  isOpen,
  onSelectTheater,
  onOpen,
  onScheduleClose,
  onCancelClose,
}: TheaterMarkerProps) {
  const point = projectToFrame(theater.lat, theater.lng);
  const isActive = shows.length > 0;

  return (
    <div
      className={classNames(styles.marker, { [styles.markerOpen]: isOpen })}
      style={{ left: `${point.x}px`, top: `${point.y}px` }}
    >
      <button
        type="button"
        className={styles.dotButton}
        aria-label={`${theater.name}, ${theater.neighborhood}`}
        onClick={() => onSelectTheater(theater.slug)}
        onMouseEnter={() => onOpen(theater.slug)}
        onMouseLeave={onScheduleClose}
        onFocus={() => onOpen(theater.slug)}
        onBlur={onScheduleClose}
      >
        <span
          className={classNames(styles.dot, {
            [styles.dotDim]: !isActive,
            [styles.dotFocused]: isFocused,
            [styles.dotHighlighted]: isHighlighted,
          })}
        >
          <span className={styles.dotCore} />
          {isFocused && <span className={styles.dotPulse} />}
        </span>
      </button>

      {isOpen && (
        <div className={styles.popup} onMouseEnter={onCancelClose} onMouseLeave={onScheduleClose}>
          <div className={styles.popHeader}>
            <span className={styles.popName}>{theater.name}</span>
            <span className={styles.popHood}>{theater.neighborhood}</span>
          </div>

          {shows.length === 0 ? (
            <p className={styles.popEmpty}>No upcoming shows</p>
          ) : (
            <ul className={styles.popList}>
              {shows.slice(0, 3).map((show) => (
                <li key={show.id} className={styles.popRow}>
                  <Link to={`/events/${show.slug}`} className={styles.popShow}>
                    <span className={styles.popDate}>{formatEventDate(show.starts_at)}</span>
                    <span className={styles.popTitle}>{show.title}</span>
                  </Link>
                  {show.ticket_url && (
                    <a
                      className={styles.popTickets}
                      href={show.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Get tickets for ${show.title}`}
                    >
                      <Ticket size={14} />
                    </a>
                  )}
                </li>
              ))}
              {shows.length > 3 && (
                <li>
                  <Link to="/events" className={styles.popMore}>
                    See all {shows.length}
                    <ArrowRight size={12} />
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface ChicagoMapProps {
  theaters: DiscoverTheater[];
  events: DiscoverEvent[];
  focusedTheaterSlug: string | null;
  highlightedTheaterSlug: string | null;
  onSelectTheater: (slug: string) => void;
  onHoverTheater: (slug: string | null) => void;
  /** Render a left-to-right legibility gradient inside the map (below markers). */
  scrim?: boolean;
  className?: string;
}

export function ChicagoMap({
  theaters,
  events,
  focusedTheaterSlug,
  highlightedTheaterSlug,
  onSelectTheater,
  onHoverTheater,
  scrim = false,
  className,
}: ChicagoMapProps) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const showsByTheater = useMemo(() => {
    const grouped = new Map<string, DiscoverEvent[]>();
    for (const event of events) {
      if (!event.theater_slug) continue;
      const list = grouped.get(event.theater_slug) ?? [];
      list.push(event);
      grouped.set(event.theater_slug, list);
    }
    return grouped;
  }, [events]);

  const openPopup = (slug: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenSlug(slug);
    onHoverTheater(slug);
  };

  // Hovering off a dot keeps the popup alive long enough to move the cursor into
  // it and click a link; moving back onto either cancels the pending close.
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenSlug(null), POPUP_CLOSE_DELAY);
    onHoverTheater(null);
  };

  const cancelClose = () => window.clearTimeout(closeTimer.current);

  return (
    <div className={classNames(styles.map, className)}>
      <Basemap />

      {scrim && <div className={styles.scrim} />}

      <div className={styles.markers} style={FRAME_STYLE}>
        {theaters.map((theater) => (
          <TheaterMarker
            key={theater.slug}
            theater={theater}
            shows={showsByTheater.get(theater.slug) ?? []}
            isFocused={theater.slug === focusedTheaterSlug}
            isHighlighted={theater.slug === highlightedTheaterSlug}
            isOpen={theater.slug === openSlug}
            onSelectTheater={onSelectTheater}
            onOpen={openPopup}
            onScheduleClose={scheduleClose}
            onCancelClose={cancelClose}
          />
        ))}
      </div>
    </div>
  );
}
