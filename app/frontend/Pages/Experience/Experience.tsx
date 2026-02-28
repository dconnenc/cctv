import { useEffect } from 'react';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ParticipantsList } from '@cctv/components';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUser } from '@cctv/contexts/UserContext';
import { Button } from '@cctv/core/Button/Button';
import ExperienceBlockContainer from '@cctv/experiences/ExperienceBlockContainer/ExperienceBlockContainer';
import { useClearAvatars } from '@cctv/hooks/useClearAvatars';

import AdminNotification from './AdminNotification/AdminNotification';

import styles from './Experience.module.scss';

export default function Experience() {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { experience, participant, code, isLoading, experienceStatus, error } = useExperience();
  const { isAdmin } = useUser();
  const { clearAvatars, isLoading: clearing } = useClearAvatars();

  if (isLoading) {
    return (
      <section className="page">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.subtitle}>Preparing experience…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
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
  const currentFullParticipant = participants.find((p) => p.user_id === participant?.user_id);
  const participantAvatar = currentFullParticipant?.avatar?.image;
  const needsAvatar = !isAdmin && !participantAvatar;

  // Wait for both experience AND participant data before checking avatar
  const hasInitialData = !isAdmin ? experience && participant : experience;

  useEffect(() => {
    if (locationState?.avatarSubmitted) return;
    if (experienceStatus === 'lobby' && needsAvatar && code && !isLoading && hasInitialData) {
      navigate(`/experiences/${code}/avatar`, { replace: true });
    }
  }, [locationState, experienceStatus, needsAvatar, code, navigate, isLoading, hasInitialData]);
  const currentBlock = experience?.blocks?.[0];

  if (experienceStatus === 'lobby') {
    if (currentBlock && participant) {
      return (
        <section className="page">
          <div className={styles.activeExperience}>
            <h1 className={styles.title}>{experience?.name || code}</h1>

            {isAdmin && !participant && <AdminNotification code={code!} />}

            <div className={styles.experienceContent}>
              <div className={styles.activeBlock}>
                <ExperienceBlockContainer block={currentBlock} participant={participant} />
              </div>
            </div>

            <div className={styles.playbillCta}>
              <Link to={`/experiences/${code}/playbill`}>
                <Button>Open Playbill</Button>
              </Link>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="page">
        <div className={styles.lobbyGrid}>
          <div className={styles.topArea}>
            {experience && (
              <div className={styles.experienceInfo}>
                <h2 className={styles.experienceName}>{experience.name}</h2>
                <p className={styles.experienceStatus}>Status: {experience.status}</p>
              </div>
            )}

            {isAdmin && !participant && <AdminNotification code={code!} />}
          </div>

          <div className={styles.middleArea}>
            <div className={styles.participantsContainer}>
              <h4 className={styles.participantsTitle}>Players in Lobby:</h4>
              {experience && participants.length > 0 ? (
                <ParticipantsList
                  participants={participants}
                  highlightUserId={participant?.user_id}
                  showRole={false}
                />
              ) : (
                <p className={styles.loadingParticipants}>
                  {experience ? 'No participants yet...' : 'Loading participants...'}
                </p>
              )}
            </div>

            <p className={styles.waitingMessage}>Waiting for the experience to start...</p>
          </div>

          {/* Admin/Host control: clear avatars (lobby view without a current block) */}
          {(isAdmin || experience?.hosts?.some((h) => h.user_id === participant?.user_id)) && (
            <div className={styles.adminControls}>
              <Button
                onClick={async () => {
                  if (
                    confirm('Clear all participant avatars and drawings? This cannot be undone.')
                  ) {
                    await clearAvatars();
                  }
                }}
                disabled={clearing}
              >
                {clearing ? 'Clearing…' : 'Clear Avatars'}
              </Button>
            </div>
          )}

          <div className={styles.bottomActions}>
            {isAdmin && (
              <Link to={`/experiences/${code}/manage`} className={styles.actionLink}>
                <Button className={`${styles.actionButton} ${styles.ghostButton}`}>Manage</Button>
              </Link>
            )}
            {!needsAvatar && (
              <Link to={`/experiences/${code}/playbill`} className={styles.actionLink}>
                <Button className={styles.actionButton}>Open Playbill</Button>
              </Link>
            )}
          </div>
        </div>
        {!isAdmin && participantAvatar && (
          <button
            className={styles.avatarToggleBtn}
            aria-label="Edit avatar"
            title="Edit avatar"
            onClick={() => navigate(`/experiences/${code}/avatar`)}
          >
            <img className={styles.avatarToggleImg} src={participantAvatar} alt="Your avatar" />
          </button>
        )}
      </section>
    );
  }

  // Active experience state (for when the experience is live or paused)
  if (experienceStatus === 'live' || experienceStatus === 'paused') {
    return (
      <section className="page">
        <div className={styles.activeExperience}>
          <h1 className={styles.title}>{experience?.name || code}</h1>

          {isAdmin && !participant && <AdminNotification code={code!} />}

          <div className={styles.experienceContent}>
            {currentBlock && participant ? (
              <div className={styles.activeBlock}>
                <ExperienceBlockContainer
                  block={currentBlock}
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
    <section className="page">
      <h1 className={styles.title}>{code}</h1>
      <p className={styles.subtitle}>Initializing experience...</p>
    </section>
  );
}
