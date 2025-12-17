import { useState } from 'react';

import { createPortal } from 'react-dom';

import { Link, NavLink } from 'react-router-dom';

import { LobbyAvatarEditor } from '@cctv/components';
import { ParticipantsList } from '@cctv/components';
import { useUser } from '@cctv/contexts';
import { useExperience } from '@cctv/contexts';
import { Button } from '@cctv/core';
import { ExperienceBlockContainer } from '@cctv/experiences';
import { useClearAvatars } from '@cctv/hooks';

import AdminNotification from './AdminNotification/AdminNotification';

import styles from './Experience.module.scss';

export default function Experience() {
  const { experience, participant, code, isLoading, experienceStatus, error } = useExperience();
  const { isAdmin } = useUser();
  const [showAvatarEditor, setShowAvatarEditor] = useState(true);
  const { clearAvatars, isLoading: clearing } = useClearAvatars();

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
  const currentFullParticipant = participants.find((p) => p.user_id === participant?.user_id);
  const participantAvatar = currentFullParticipant?.avatar?.image;
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
      <section className="page flex-centered">
        {experience && (
          <div className={styles.experienceInfo}>
            <h2 className={styles.experienceName}>{experience.name}</h2>
            <p className={styles.experienceStatus}>Status: {experience.status}</p>
          </div>
        )}

        {isAdmin && !participant && <AdminNotification code={code!} />}

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

        {/* Admin/Host control: clear avatars (lobby view without a current block) */}
        {(isAdmin || experience?.hosts?.some((h) => h.user_id === participant?.user_id)) && (
          <div className={styles.adminControls}>
            <Button
              onClick={async () => {
                if (confirm('Clear all participant avatars and drawings? This cannot be undone.')) {
                  await clearAvatars();
                }
              }}
              disabled={clearing}
            >
              {clearing ? 'Clearing…' : 'Clear Avatars'}
            </Button>
          </div>
        )}

        {isAdmin && (
          <div className={styles.adminActions}>
            <NavLink to={`/experiences/${code}/manage`} className={styles.adminButton}>
              Manage
            </NavLink>
          </div>
        )}

        <p className={styles.waitingMessage}>Waiting for the experience to start...</p>

        {!isAdmin && showAvatarEditor && (
          <div className={styles.avatarEditor}>
            <LobbyAvatarEditor onFinalize={() => setShowAvatarEditor(false)} />
          </div>
        )}

        {!isAdmin &&
          !showAvatarEditor &&
          (typeof document !== 'undefined'
            ? createPortal(
                <button
                  className={styles.avatarToggleBtn}
                  aria-label="Edit avatar"
                  title="Edit avatar"
                  onClick={() => setShowAvatarEditor(true)}
                >
                  {participantAvatar ? (
                    <img
                      className={styles.avatarToggleImg}
                      src={participantAvatar}
                      alt="Your avatar"
                    />
                  ) : (
                    <span>✎</span>
                  )}
                </button>,
                document.body,
              )
            : null)}

        <div className={styles.playbillCta}>
          <Link to={`/experiences/${code}/playbill`}>
            <Button>Open Playbill</Button>
          </Link>
        </div>
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
    <section className="page flex-centered">
      <h1 className={styles.title}>{code}</h1>
      <p className={styles.subtitle}>Initializing experience...</p>
    </section>
  );
}
