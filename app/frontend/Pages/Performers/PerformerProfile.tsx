import { Link, useParams } from 'react-router-dom';

import { Edit2 } from 'lucide-react';

import { useUser } from '@cctv/contexts';
import { Panel } from '@cctv/core';
import { useFollowPerformer, usePerformer } from '@cctv/hooks';
import { formatEventTime } from '@cctv/utils/calendar';

import styles from './Performers.module.scss';

const dateParts = (iso: string) => {
  const d = new Date(iso);
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dom: d.toLocaleDateString('en-US', { day: 'numeric' }),
    mo: d.toLocaleDateString('en-US', { month: 'short' }),
  };
};

export default function PerformerProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { performer, isLoading, refetch } = usePerformer(slug ?? '');
  const { user } = useUser();
  const { follow, unfollow, isLoading: followLoading } = useFollowPerformer();

  const isOwner = !!performer?.editable_by_current_user;

  const handleFollowToggle = async () => {
    if (!performer) return;
    if (performer.followed_by_current_user) {
      await unfollow(performer.slug);
    } else {
      await follow(performer.slug);
    }
    refetch();
  };

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <div>Loading performer...</div>
      </section>
    );
  }

  if (!performer) {
    return (
      <section className="page flex-centered">
        <div>Performer not found</div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className={styles.profileContainer}>
        <Panel className={styles.profilePanel}>
          <header className={styles.hero}>
            {performer.photo_url ? (
              <img
                src={performer.photo_url}
                alt={performer.name}
                className={styles.heroPhoto}
                width={140}
                height={140}
              />
            ) : (
              <div className={styles.heroPhoto} aria-hidden>
                <span className={styles.heroPhotoInitial}>
                  {performer.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className={styles.heroIdentity}>
              <span className={styles.heroEyebrow}>Performer</span>
              <h1 className={styles.heroName}>{performer.name}</h1>
            </div>
            <div className={styles.heroMeta}>
              <span className={styles.heroFollowers}>
                {performer.follower_count}{' '}
                {performer.follower_count === 1 ? 'follower' : 'followers'}
              </span>
              <div className={styles.heroActions}>
                {user && !isOwner && (
                  <button
                    className={`${styles.followBtnLarge} ${performer.followed_by_current_user ? styles.following : ''}`}
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                  >
                    {performer.followed_by_current_user ? 'Following' : 'Follow'}
                  </button>
                )}
                {isOwner && (
                  <Link to={`/performers/${performer.slug}/edit`} className={styles.editBtn}>
                    <Edit2 size={14} />
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>
          </header>

          {performer.bio && <p className={styles.bio}>{performer.bio}</p>}

          {performer.upcoming_events && performer.upcoming_events.length > 0 && (
            <section className={styles.upcomingSection}>
              <h2 className={styles.sectionTitle}>Upcoming Shows</h2>
              <ol className={styles.eventsList}>
                {performer.upcoming_events.map((event) => {
                  const d = dateParts(event.starts_at);
                  return (
                    <li key={event.id} className={styles.eventItemWrapper}>
                      <Link to={`/events/${event.slug}`} className={styles.eventItem}>
                        <div className={styles.eventDateBlock} aria-hidden>
                          <span className={styles.eventDateDow}>{d.dow}</span>
                          <span className={styles.eventDateDom}>{d.dom}</span>
                          <span className={styles.eventDateMo}>{d.mo}</span>
                        </div>
                        <div className={styles.eventBody}>
                          <span className={styles.eventTitle}>{event.title}</span>
                          {event.venue_name && (
                            <span className={styles.eventVenue}>{event.venue_name}</span>
                          )}
                        </div>
                        <span className={styles.eventTime}>{formatEventTime(event.starts_at)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </Panel>
      </div>
    </section>
  );
}
