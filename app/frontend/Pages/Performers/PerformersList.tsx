import { Link } from 'react-router-dom';

import { Plus, Users } from 'lucide-react';

import { useUser } from '@cctv/contexts';
import { usePerformers } from '@cctv/hooks';
import { Performer } from '@cctv/types';

import styles from './Performers.module.scss';

export default function PerformersList() {
  const { performers, isLoading } = usePerformers();
  const { user } = useUser();
  const hasPerformerProfile = performers.some((p) => p.editable_by_current_user);

  return (
    <section className="page">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Users size={24} />
            Performers
          </h1>
          {user && !hasPerformerProfile && (
            <Link to="/performers/new" className={styles.createBtn}>
              <Plus size={16} />
              Become a Performer
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading performers...</div>
        ) : performers.length === 0 ? (
          <div className={styles.empty}>No performers yet</div>
        ) : (
          <div className={styles.grid}>
            {performers.map((performer) => (
              <PerformerCard key={performer.id} performer={performer} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PerformerCard({ performer }: { performer: Performer }) {
  return (
    <Link to={`/performers/${performer.slug}`} className={styles.card}>
      {performer.photo_url ? (
        <img
          src={performer.photo_url}
          alt={performer.name}
          className={styles.photo}
          loading="lazy"
          width={60}
          height={60}
        />
      ) : (
        <div className={styles.photoPlaceholder}>{performer.name.charAt(0).toUpperCase()}</div>
      )}
      <div className={styles.cardInfo}>
        <h3 className={styles.cardName}>{performer.name}</h3>
        {performer.bio && <p className={styles.cardBio}>{performer.bio}</p>}
        <span className={styles.followers}>
          {performer.follower_count} {performer.follower_count === 1 ? 'follower' : 'followers'}
        </span>
      </div>
    </Link>
  );
}
