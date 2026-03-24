import { useMemo } from 'react';

import { Link, useParams } from 'react-router-dom';

import { Calendar, Clock, ExternalLink, MapPin, QrCode, Ticket } from 'lucide-react';

import { useUser } from '@cctv/contexts';
import { Panel } from '@cctv/core';
import { useEvent, useFollowPerformer } from '@cctv/hooks';
import { buildGoogleCalendarUrl, formatEventDateFull, formatEventTime } from '@cctv/utils/calendar';

import styles from './EventDetail.module.scss';

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { event, isLoading, refetch } = useEvent(slug ?? '');
  const { user } = useUser();
  const { follow, unfollow, isLoading: followLoading } = useFollowPerformer();

  const icalUrl = `/api/events/${slug}/ical`;
  const gcalUrl = useMemo(() => (event ? buildGoogleCalendarUrl(event) : ''), [event]);

  const qrCode = useMemo(() => {
    if (!event?.experience?.active) return null;
    const url = `${window.location.origin}/experiences/${event.experience.code_slug}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
  }, [event]);

  const handleFollowToggle = async (performerSlug: string, isFollowing: boolean) => {
    if (isFollowing) {
      await unfollow(performerSlug);
    } else {
      await follow(performerSlug);
    }
    refetch();
  };

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <div>Loading event...</div>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="page flex-centered">
        <div>Event not found</div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className={styles.container}>
        <Panel className={styles.eventPanel}>
          <h1 className={styles.title}>{event.title}</h1>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <Calendar size={16} />
              {formatEventDateFull(event.starts_at)}
            </div>
            <div className={styles.metaItem}>
              <Clock size={16} />
              {formatEventTime(event.starts_at)} &ndash; {formatEventTime(event.ends_at)}
            </div>
            {event.venue_name && (
              <div className={styles.metaItem}>
                <MapPin size={16} />
                {[event.venue_name, event.venue_address].filter(Boolean).join(', ')}
              </div>
            )}
          </div>

          {event.description && <p className={styles.description}>{event.description}</p>}

          <div className={styles.actions}>
            {event.ticket_url && (
              <a
                href={event.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ticketBtn}
              >
                <Ticket size={16} />
                {event.pricing_text ? `Get Tickets · ${event.pricing_text}` : 'Get Tickets'}
                <ExternalLink size={12} />
              </a>
            )}

            {!event.ticket_url && event.pricing_text && (
              <span className={styles.pricingText}>{event.pricing_text}</span>
            )}

            <div className={styles.calendarActions}>
              <a href={icalUrl} className={styles.calBtn}>
                Apple Calendar
              </a>
              <a href={gcalUrl} target="_blank" rel="noopener noreferrer" className={styles.calBtn}>
                Google Calendar
              </a>
            </div>
          </div>

          {/* Experience Join Section */}
          {event.experience?.active && (
            <div className={styles.joinSection}>
              <h2 className={styles.sectionTitle}>Join the Experience</h2>
              <div className={styles.joinContent}>
                {qrCode && (
                  <img src={qrCode} alt="QR code to join experience" className={styles.qrCode} />
                )}
                <Link to={`/experiences/${event.experience.code_slug}`} className={styles.joinBtn}>
                  <QrCode size={16} />
                  Join Now
                </Link>
              </div>
            </div>
          )}

          {/* Performers */}
          {event.performers.length > 0 && (
            <div className={styles.performersSection}>
              <h2 className={styles.sectionTitle}>Performers</h2>
              <div className={styles.performers}>
                {event.performers.map((performer) => (
                  <div key={performer.id} className={styles.performerCard}>
                    {performer.photo_url ? (
                      <img
                        src={performer.photo_url}
                        alt={performer.name}
                        className={styles.performerPhoto}
                      />
                    ) : (
                      <div className={styles.performerPhotoPlaceholder}>
                        {performer.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <Link to={`/performers/${performer.slug}`} className={styles.performerName}>
                      {performer.name}
                    </Link>
                    {user && (
                      <button
                        className={`${styles.followBtn} ${performer.followed_by_current_user ? styles.following : ''}`}
                        onClick={() =>
                          handleFollowToggle(performer.slug, performer.followed_by_current_user)
                        }
                        disabled={followLoading}
                      >
                        {performer.followed_by_current_user ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </section>
  );
}
