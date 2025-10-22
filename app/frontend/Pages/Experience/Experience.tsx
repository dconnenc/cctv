import { Link, NavLink } from 'react-router-dom';

import { useUser } from '@cctv/contexts';
import { useExperience } from '@cctv/contexts';
import { ExperienceBlockContainer } from '@cctv/experiences';

import AdminNotification from './AdminNotification/AdminNotification';

import styles from './Experience.module.scss';

export default function Experience() {
  const {
    experience,
    participant,
    code,
    isLoading,
    isPolling,
    experienceStatus,
    error,
    wsConnected,
    wsError,
  } = useExperience();
  const { isAdmin } = useUser();

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.subtitle}>Preparing experience…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.error}>{error || 'Something went wrong'}</p>
        <div className={styles.errorActions}>
          <Link to="/join" className={styles.link}>
            Join Different Experience
          </Link>
        </div>
      </section>
    );
  }

  const participants = experience?.participants || [];

  if (experienceStatus === 'lobby') {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code}</h1>

        {experience && (
          <div className={styles.experienceInfo}>
            <h2 className={styles.experienceName}>{experience.name}</h2>
            <p className={styles.experienceStatus}>Status: {experience.status}</p>
          </div>
        )}

        {isAdmin && !participant && <AdminNotification code={code!} />}

        <div className={styles.participantsContainer}>
          <h4 className={styles.participantsTitle}>Players in Lobby:</h4>
          {participants.length > 0 ? (
            <ul className={styles.participantsList}>
              {participants.map((p) => (
                <li key={p.id} className={styles.participantItem}>
                  <span
                    className={`${styles.participantName} ${
                      p.user_id === participant?.user_id ? styles.currentUser : ''
                    }`}
                  >
                    {p.name || p.email}
                  </span>
                  {p.user_id === participant?.user_id && (
                    <span className={styles.youIndicator}>(You)</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.loadingParticipants}>Loading participants...</p>
          )}
        </div>

        {isAdmin && (
          <div className={styles.adminActions}>
            <NavLink to={`/experiences/${code}/manage`} className={styles.adminButton}>
              Manage
            </NavLink>
          </div>
        )}

        <p className={styles.waitingMessage}>Waiting for the experience to start...</p>
      </section>
    );
  }

  // Active experience state (for when the experience is live or paused)
  if (experienceStatus === 'live' || experienceStatus === 'paused') {
    // Find the first open block to display
    const openBlock = experience?.blocks?.find((block) => block.status === 'open');

    return (
      <section className="page">
        <div className={styles.activeExperience}>
          <h1 className={styles.title}>{experience?.name || code}</h1>

          {isAdmin && !participant && <AdminNotification code={code!} />}

          <div className={styles.experienceContent}>
            {openBlock && participant ? (
              <div className={styles.activeBlock}>
                <ExperienceBlockContainer
                  block={openBlock}
                  participant={participant}
                  disabled={experience?.status === 'paused'}
                />
              </div>
            ) : (
              <div className={styles.waitingForBlock}>
                <p>
                  {experience?.status === 'paused'
                    ? 'Experience is paused...'
                    : 'Waiting for the next activity...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Fallback
  return (
    <section className="page flex-centered">
      <h1 className={styles.title}>{code}</h1>
      <p className={styles.subtitle}>Initializing experience...</p>
    </section>
  );
}
