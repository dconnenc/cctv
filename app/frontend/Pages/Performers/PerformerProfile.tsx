import { Link, useParams } from 'react-router-dom';

import { Edit2 } from 'lucide-react';

import { useUser } from '@cctv/contexts';
import { Panel } from '@cctv/core';
import { useFollowPerformer, usePerformer } from '@cctv/hooks';
import { formatEventDate, formatEventTime } from '@cctv/utils/calendar';

import styles from './Performers.module.scss';

export default function PerformerProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { performer, isLoading, refetch } = usePerformer(slug ?? '');
  const { user } = useUser();
  const { follow, unfollow, isLoading: followLoading } = useFollowPerformer();

  const isOwner = user && performer && user.id === (performer as any).user_id;

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
          <div className={styles.profileHeader}>
            {performer.photo_url ? (
              <img src={performer.photo_url} alt={performer.name} className={styles.profilePhoto} />
            ) : (
              <div className={styles.profilePhotoPlaceholder}>
                {performer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.profileInfo}>
              <h1 className={styles.profileName}>{performer.name}</h1>
              <span className={styles.followers}>
                {performer.follower_count}{' '}
                {performer.follower_count === 1 ? 'follower' : 'followers'}
              </span>
              <div className={styles.profileActions}>
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
          </div>

          {performer.bio && <p className={styles.bio}>{performer.bio}</p>}

          {performer.upcoming_events && performer.upcoming_events.length > 0 && (
            <div className={styles.upcomingSection}>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              <div className={styles.eventsList}>
                {performer.upcoming_events.map((event) => (
                  <Link key={event.id} to={`/events/${event.slug}`} className={styles.eventItem}>
                    <span className={styles.eventDate}>{formatEventDate(event.starts_at)}</span>
                    <span className={styles.eventItemTitle}>{event.title}</span>
                    <span className={styles.eventItemTime}>{formatEventTime(event.starts_at)}</span>
                    {event.venue_name && (
                      <span className={styles.eventItemVenue}>{event.venue_name}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </section>
  );
}
