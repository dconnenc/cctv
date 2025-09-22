import { Link } from 'react-router-dom';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Block, ParticipantWithRole } from '@cctv/types';
import Poll from '@cctv/experiences/Poll/Poll';

import styles from './Experience.module.scss';


// Function to render the appropriate block based on its kind
function renderBlock(block: Block, user: ParticipantWithRole | null) {
  if (!user) {
    return <p>User information is missing.</p>;
  }

  if (!block.payload) {
    return <p>Block configuration is missing.</p>;
  }

  switch (block.kind) {
    case 'poll':
      const { question, options, pollType = 'single' } = block.payload;

      if (!question || !options || !Array.isArray(options)) {
        return <p>This poll is incorrectly configured.</p>;
      }

      return (
        <Poll
          type="poll"
          question={question}
          options={options}
          pollType={pollType}
          user={user}
          blockId={block.id}
          responses={block.responses}
        />
      );
    default:
      return (
        <div className={styles.unknownBlock}>
          <p>Unknown block type: {block.kind}</p>
          <pre>{JSON.stringify(block.payload, null, 2)}</pre>
        </div>
      );
  }
}

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
  if (experienceStatus === 'live') {
    // Find the first open block to display
    const openBlock = experience?.blocks?.find(block => block.status === 'open');

    return (
      <section className="page">
        <div className={styles.activeExperience}>
          <h1 className={styles.title}>{experience?.name || code}</h1>
          <div className={styles.experienceContent}>
            {openBlock ? (
              <div className={styles.activeBlock}>
                {renderBlock(openBlock, user)}
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
