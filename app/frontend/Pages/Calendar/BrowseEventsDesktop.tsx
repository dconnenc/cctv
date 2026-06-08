import { useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import { ChicagoMap, ShowCard } from '@cctv/components';
import { useDiscover } from '@cctv/hooks';

import styles from './BrowseEventsDesktop.module.scss';

export default function BrowseEventsDesktop() {
  const { theaters, events, isLoading } = useDiscover();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);

  const neighborhoodBySlug = useMemo(
    () => new Map(theaters.map((theater) => [theater.slug, theater.neighborhood])),
    [theaters],
  );

  const focused = events.find((event) => event.id === focusedId) ?? events[0] ?? null;
  const rest = focused ? events.filter((event) => event.id !== focused.id) : [];

  const handleSelectTheater = (slug: string) => {
    const next = events.find((event) => event.theater_slug === slug);
    if (next) setFocusedId(next.id);
  };

  const neighborhoodFor = (slug: string | null) =>
    slug ? neighborhoodBySlug.get(slug) : undefined;

  return (
    <section className={styles.stage}>
      <ChicagoMap
        className={styles.mapBg}
        theaters={theaters}
        events={events}
        focusedTheaterSlug={focused?.theater_slug ?? null}
        highlightedTheaterSlug={hoverSlug}
        onSelectTheater={handleSelectTheater}
        onHoverTheater={setHoverSlug}
        scrim
      />
      <div className={styles.intro}>
        <h1 className={styles.title}>Events</h1>
        <p className={styles.subtitle}>Every upcoming show across Chicago.</p>
      </div>

      <div className={styles.rail}>
        {isLoading ? (
          <div className={styles.list}>
            <div className={`${styles.skeleton} ${styles.skeletonFeatured}`} />
            <div className={`${styles.skeleton} ${styles.skeletonSmall}`} />
            <div className={`${styles.skeleton} ${styles.skeletonSmall}`} />
          </div>
        ) : !focused ? (
          <div className={styles.empty}>
            <p>No upcoming shows right now.</p>
            <Link to="/join" className="link">
              Join a show
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            <ShowCard
              event={focused}
              variant="featured"
              neighborhood={neighborhoodFor(focused.theater_slug)}
              isHighlighted={!!focused.theater_slug && hoverSlug === focused.theater_slug}
              onHover={(hovering) => setHoverSlug(hovering ? focused.theater_slug : null)}
            />
            {rest.map((event) => (
              <ShowCard
                key={event.id}
                event={event}
                variant="compact"
                neighborhood={neighborhoodFor(event.theater_slug)}
                isHighlighted={!!event.theater_slug && hoverSlug === event.theater_slug}
                onSelect={() => setFocusedId(event.id)}
                onHover={(hovering) => setHoverSlug(hovering ? event.theater_slug : null)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
