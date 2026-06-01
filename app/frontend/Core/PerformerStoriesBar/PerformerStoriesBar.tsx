import { Link } from 'react-router-dom';

import { TheScenePerformer } from '@cctv/types';

import styles from './PerformerStoriesBar.module.scss';

interface Props {
  performers: TheScenePerformer[];
  className?: string;
}

export function PerformerStoriesBar({ performers, className }: Props) {
  if (!performers || performers.length === 0) return null;

  return (
    <div className={`${styles.root} ${className ?? ''}`}>
      <div className={styles.scroller}>
        {performers.map((performer) => {
          const initial = (performer.name?.charAt(0) ?? '?').toUpperCase();
          const content = (
            <>
              <div className={styles.ringWrap}>
                <div className={styles.avatar}>
                  {performer.photo_url ? (
                    <img src={performer.photo_url} alt={performer.name} />
                  ) : (
                    <span className={styles.initial}>{initial}</span>
                  )}
                </div>
              </div>
              <span className={styles.name}>{performer.name}</span>
            </>
          );

          return performer.slug ? (
            <Link
              key={performer.participant_id}
              to={`/performers/${performer.slug}`}
              className={styles.item}
            >
              {content}
            </Link>
          ) : (
            <div key={performer.participant_id} className={styles.item}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PerformerStoriesBar;
