import { useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import { ChicagoMap, ShowCard } from '@cctv/components';
import { Button } from '@cctv/core';
import { useDiscover } from '@cctv/hooks';

import styles from './HomeDesktop.module.scss';

const TAGLINES = [
  'Funnier than a Cubs rebuild.',
  'Comedy, hold the ketchup.',
  'Laughs deeper than the dish.',
  'Ope — comedy, just gonna sneak right past ya.',
  'Colder takes than a January on the L.',
  'Sweet home, dark humor.',
  'Stand-up from the city of big shoulders.',
  'Punchlines sharper than the wind off the lake.',
];

export default function HomeDesktop() {
  const { theaters, events, isLoading } = useDiscover();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);

  const tagline = useMemo(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)], []);
  const neighborhoodBySlug = useMemo(
    () => new Map(theaters.map((theater) => [theater.slug, theater.neighborhood])),
    [theaters],
  );

  const focused = events.find((event) => event.id === focusedId) ?? events[0] ?? null;
  const others = focused ? events.filter((event) => event.id !== focused.id).slice(0, 2) : [];

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
      <div className={styles.hero}>
        <h1 className={styles.wordmark}>CCTV</h1>
        <p className={styles.tagline}>{tagline}</p>
        <div className={styles.heroActions}>
          <Button to="/join" size="lg">
            Join Show
          </Button>
          <Link to="/about" className="link">
            About
          </Link>
        </div>
      </div>

      <div className={styles.rail}>
        <h2 className={styles.railHeading}>Upcoming</h2>

        {isLoading ? (
          <div className={styles.cards}>
            <div className={`${styles.skeleton} ${styles.skeletonFeatured}`} />
            <div className={styles.smallRow}>
              <div className={`${styles.skeleton} ${styles.skeletonSmall}`} />
              <div className={`${styles.skeleton} ${styles.skeletonSmall}`} />
            </div>
          </div>
        ) : !focused ? (
          <div className={styles.empty}>
            <p>No upcoming shows right now.</p>
            <Link to="/join" className="link">
              Join a show
            </Link>
          </div>
        ) : (
          <div className={styles.cards}>
            <ShowCard
              event={focused}
              variant="featured"
              neighborhood={neighborhoodFor(focused.theater_slug)}
              isHighlighted={!!focused.theater_slug && hoverSlug === focused.theater_slug}
              onHover={(hovering) => setHoverSlug(hovering ? focused.theater_slug : null)}
            />
            {others.length > 0 && (
              <div className={styles.smallRow}>
                {others.map((event) => (
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
        )}
      </div>
    </section>
  );
}
