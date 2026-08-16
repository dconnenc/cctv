import { type MutableRefObject, useEffect, useMemo, useRef } from 'react';

import { Link } from 'react-router-dom';

import classNames from 'classnames';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, Ticket } from 'lucide-react';
import { MapContainer, Marker, Pane, Popup, TileLayer, useMap } from 'react-leaflet';

import { useTheme } from '@cctv/contexts/ThemeContext';
import { DiscoverEvent, DiscoverTheater } from '@cctv/types';
import { formatEventDate } from '@cctv/utils/calendar';

import styles from './ChicagoMap.module.scss';
import './leaflet-markers.css';

// Centred toward the shoreline so, full-bleed, the venues sit left-of-centre and
// Lake Michigan fills the right of the screen (behind the rail).
const CENTER: [number, number] = [41.915, -87.655];
const ZOOM = 13;

// Sits above the tile pane (200) but below the marker (600) and popup (700)
// panes, so the legibility gradient never covers dots or tooltips.
const SCRIM_PANE_Z = 450;
const POPUP_CLOSE_DELAY = 15000;

const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

function theaterIcon(opts: { isActive: boolean; isFocused: boolean; isHighlighted: boolean }) {
  const cls = classNames('cctv-dot', {
    'cctv-dot--active': opts.isActive,
    'cctv-dot--dim': !opts.isActive,
    'cctv-dot--focused': opts.isFocused,
    'cctv-dot--highlighted': opts.isHighlighted,
  });
  return L.divIcon({
    className: 'cctv-marker',
    html: `<span class="${cls}"><span class="cctv-dot__core"></span>${
      opts.isFocused ? '<span class="cctv-dot__pulse"></span>' : ''
    }</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
  });
}

// Leaflet measures its container on mount; if that happens before layout settles
// the tiles render grey until the first interaction. Nudge it.
function MapSizer() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const id = window.setTimeout(fix, 200);
    window.addEventListener('resize', fix);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', fix);
    };
  }, [map]);
  return null;
}

// Keeps an open popup alive while the cursor is over it, and re-arms the close
// timer when the cursor leaves — so hovering into the popup to click a link
// doesn't trip the auto-close.
function PopupHoverGuard({ closeTimer }: { closeTimer: MutableRefObject<number | undefined> }) {
  const map = useMap();
  useEffect(() => {
    let detach: (() => void) | null = null;

    const onOpen = (event: L.PopupEvent) => {
      const el = event.popup.getElement();
      if (!el) return;
      const cancel = () => window.clearTimeout(closeTimer.current);
      const schedule = () => {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => map.closePopup(), POPUP_CLOSE_DELAY);
      };
      el.addEventListener('mouseenter', cancel);
      el.addEventListener('mouseleave', schedule);
      detach = () => {
        el.removeEventListener('mouseenter', cancel);
        el.removeEventListener('mouseleave', schedule);
      };
    };

    const onClose = () => {
      detach?.();
      detach = null;
    };

    map.on('popupopen', onOpen);
    map.on('popupclose', onClose);
    return () => {
      map.off('popupopen', onOpen);
      map.off('popupclose', onClose);
      detach?.();
    };
  }, [map, closeTimer]);

  return null;
}

interface TheaterMarkerProps {
  theater: DiscoverTheater;
  shows: DiscoverEvent[];
  isFocused: boolean;
  isHighlighted: boolean;
  onSelectTheater: (slug: string) => void;
  onHoverTheater: (slug: string | null) => void;
  closeTimer: MutableRefObject<number | undefined>;
}

function TheaterMarker({
  theater,
  shows,
  isFocused,
  isHighlighted,
  onSelectTheater,
  onHoverTheater,
  closeTimer,
}: TheaterMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  return (
    <Marker
      ref={markerRef}
      position={[theater.lat, theater.lng]}
      icon={theaterIcon({ isActive: shows.length > 0, isFocused, isHighlighted })}
      eventHandlers={{
        click: () => onSelectTheater(theater.slug),
        mouseover: () => {
          window.clearTimeout(closeTimer.current);
          markerRef.current?.openPopup();
          onHoverTheater(theater.slug);
        },
        mouseout: () => {
          window.clearTimeout(closeTimer.current);
          closeTimer.current = window.setTimeout(
            () => markerRef.current?.closePopup(),
            POPUP_CLOSE_DELAY,
          );
          onHoverTheater(null);
        },
      }}
    >
      <Popup closeButton={false}>
        <div className={styles.popup}>
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
      </Popup>
    </Marker>
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
  const { theme } = useTheme();
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

  return (
    <div className={classNames(styles.map, className)}>
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
        zoomControl={false}
        attributionControl={false}
        className={styles.leaflet}
      >
        <TileLayer key={theme} url={theme === 'light' ? TILE_URLS.light : TILE_URLS.dark} />
        <MapSizer />
        <PopupHoverGuard closeTimer={closeTimer} />

        {scrim && (
          <Pane name="cctv-scrim" style={{ zIndex: SCRIM_PANE_Z }}>
            <div className={styles.scrim} />
          </Pane>
        )}

        {theaters.map((theater) => (
          <TheaterMarker
            key={theater.slug}
            theater={theater}
            shows={showsByTheater.get(theater.slug) ?? []}
            isFocused={theater.slug === focusedTheaterSlug}
            isHighlighted={theater.slug === highlightedTheaterSlug}
            onSelectTheater={onSelectTheater}
            onHoverTheater={onHoverTheater}
            closeTimer={closeTimer}
          />
        ))}
      </MapContainer>
    </div>
  );
}
