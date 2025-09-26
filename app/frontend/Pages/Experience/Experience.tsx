import { Link } from 'react-router-dom';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUser } from '@cctv/contexts/UserContext';
import ExperienceBlockContainer from '@cctv/experiences/ExperienceBlockContainer/ExperienceBlockContainer';

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

        {/* Admin viewing notification */}
        {isAdmin && !participant && (
          <div className={styles.adminNotification}>
            <p className={styles.adminMessage}>
              You're viewing this experience as an admin but aren't registered as a participant.
            </p>
            <div className={styles.adminActions}>
              <Link to={`/experiences/${code}/register`} className={styles.adminActionButton}>
                Register to Participate
              </Link>
              <Link to={`/experiences/${code}/manage`} className={styles.adminActionButton}>
                Manage Experience
              </Link>
            </div>
          </div>
        )}

        <p className={styles.participantsCount}>
          Participants: {participants.length}
          {isPolling && <span className={styles.loadingSpinner}>🔄</span>}
        </p>

        {/* WebSocket Connection Status */}
        <div className={styles.connectionStatus}>
          {wsConnected ? (
            <span className={styles.connected}>🟢 Real-time connected</span>
          ) : (
            <span className={styles.disconnected}>
              🔴 {wsError || 'Not connected to real-time updates'}
            </span>
          )}
        </div>

        {/* Participants List */}
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

        <p className={styles.waitingMessage}>Waiting for the experience to start...</p>
      </section>
    );
  }

  // Active experience state (for when the experience is actually running)
  if (experienceStatus === 'live') {
    // Find the first open block to display
    const openBlock = experience?.blocks?.find((block) => block.status === 'open');

    return (
      <section className="page">
        <div className={styles.activeExperience}>
          <h1 className={styles.title}>{experience?.name || code}</h1>

          {/* Admin viewing notification */}
          {isAdmin && !participant && (
            <div className={styles.adminNotification}>
              <p className={styles.adminMessage}>
                You're viewing this experience as an admin but aren't registered as a participant.
              </p>
              <div className={styles.adminActions}>
                <Link to={`/experiences/${code}/register`} className={styles.adminActionButton}>
                  Register to Participate
                </Link>
                <Link to={`/experiences/${code}/manage`} className={styles.adminActionButton}>
                  Manage Experience
                </Link>
              </div>
            </div>
          )}

          <div className={styles.experienceContent}>
            {openBlock && participant ? (
              <div className={styles.activeBlock}>
                <ExperienceBlockContainer block={openBlock} participant={participant} />
              </div>
            ) : (
              <div className={styles.waitingForBlock}>
                <p>Waiting for the next activity...</p>
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
