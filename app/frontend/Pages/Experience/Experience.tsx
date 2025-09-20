import { Link } from 'react-router-dom';
import { useExperience } from '@cctv/contexts/ExperienceContext';

import styles from './Experience.module.scss';

export default function Experience() {
  const {
    experience,
    user,
    code,
    isLoading,
    isPolling,
    experienceStatus,
    error,
  } = useExperience();

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

  // Lobby state
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

        <p className={styles.participantsCount}>
          Participants: {participants.length}
          {isPolling && <span className={styles.loadingSpinner}>🔄</span>}
        </p>

        {/* Participants List */}
        <div className={styles.participantsContainer}>
          <h4 className={styles.participantsTitle}>
            Players in Lobby:
          </h4>
          {participants.length > 0 ? (
            <ul className={styles.participantsList}>
              {participants.map((participant) => (
                <li
                  key={participant.id}
                  className={styles.participantItem}
                >
                  <span
                    className={`${styles.participantName} ${
                      participant.id === user?.id ? styles.currentUser : ''
                    }`}
                  >
                    {participant.name || participant.email}
                  </span>
                  {participant.id === user?.id && (
                    <span className={styles.youIndicator}>(You)</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.loadingParticipants}>
              Loading participants...
            </p>
          )}
        </div>

        <p className={styles.waitingMessage}>
          Waiting for the experience to start...
        </p>
      </section>
    );
  }

  // Active experience state (for when the experience is actually running)
  if (experienceStatus === 'active') {
    return (
      <section className="page">
        <div className={styles.activeExperience}>
          <h1 className={styles.title}>{experience?.name || code}</h1>
          <div className={styles.experienceContent}>
            {/* This is where the actual experience content would render */}
            {/* Based on experience.blocks or similar structure */}
            <p>Experience is now active!</p>
            {experience?.blocks && (
              <div className={styles.blocks}>
                {/* Render experience blocks here */}
                <pre>{JSON.stringify(experience.blocks, null, 2)}</pre>
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
