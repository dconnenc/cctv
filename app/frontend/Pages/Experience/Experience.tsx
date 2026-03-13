import { useEffect } from 'react';

import { createPortal } from 'react-dom';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { BookOpen } from 'lucide-react';

import { ParticipantsList } from '@cctv/components';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUser } from '@cctv/contexts/UserContext';
import { Button } from '@cctv/core/Button/Button';
import ExperienceBlockContainer from '@cctv/experiences/ExperienceBlockContainer/ExperienceBlockContainer';
import { useClearAvatars } from '@cctv/hooks/useClearAvatars';
import { AvatarStroke } from '@cctv/types';

import AdminNotification from './AdminNotification/AdminNotification';

import styles from './Experience.module.scss';

function AvatarCircle({ strokes }: { strokes: AvatarStroke[] }) {
  if (!strokes.length) {
    return (
      <svg viewBox="0 0 100 100" className={styles.avatarCircleSvg} aria-hidden>
        <circle cx="50" cy="36" r="18" fill="currentColor" opacity="0.45" />
        <ellipse cx="50" cy="82" rx="28" ry="22" fill="currentColor" opacity="0.45" />
      </svg>
    );
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const stroke of strokes) {
    for (let j = 0; j < stroke.points.length; j += 2) {
      minX = Math.min(minX, stroke.points[j]);
      maxX = Math.max(maxX, stroke.points[j]);
      minY = Math.min(minY, stroke.points[j + 1]);
      maxY = Math.max(maxY, stroke.points[j + 1]);
    }
  }

  const pad = 12;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = Math.max(maxX - minX, maxY - minY) / 2 + pad;
  const viewBox = `${cx - half} ${cy - half} ${half * 2} ${half * 2}`;

  return (
    <svg viewBox={viewBox} className={styles.avatarCircleSvg} aria-hidden>
      {strokes.map((stroke, i) => {
        const pts: string[] = [];
        for (let j = 0; j < stroke.points.length; j += 2) {
          pts.push(`${stroke.points[j]},${stroke.points[j + 1]}`);
        }
        return (
          <polyline
            key={i}
            points={pts.join(' ')}
            stroke={stroke.color}
            strokeWidth={Math.max(Math.min(stroke.width * 0.25, 4), 1)}
            vectorEffect="non-scaling-stroke"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

export default function Experience() {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { experience, participant, code, isLoading, experienceStatus, error } = useExperience();
  const { isAdmin } = useUser();
  const { clearAvatars, isLoading: clearing } = useClearAvatars();

  const participants = experience?.participants || [];
  const needsAvatar = !isAdmin && !participant?.avatar;
  const hasInitialData = !isAdmin ? experience && participant : experience;

  useEffect(() => {
    if (!isAdmin && participant) {
      document.body.classList.add('has-avatar-btn');
      return () => document.body.classList.remove('has-avatar-btn');
    }
  }, [isAdmin, participant]);

  const avatarBtn =
    !isAdmin && participant
      ? createPortal(
          <button
            className={styles.avatarToggleBtn}
            aria-label="Edit avatar"
            title="Edit avatar"
            onClick={() => navigate(`/experiences/${code}/avatar`)}
          >
            <AvatarCircle strokes={participant.avatar?.strokes ?? []} />
          </button>,
          document.body,
        )
      : null;

  useEffect(() => {
    if (locationState?.avatarSubmitted) return;
    if (experienceStatus === 'lobby' && needsAvatar && code && !isLoading && hasInitialData) {
      navigate(`/experiences/${code}/avatar`, { replace: true });
    }
  }, [locationState, experienceStatus, needsAvatar, code, navigate, isLoading, hasInitialData]);

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

            {experience?.playbill_enabled !== false && (
              <Link
                to={`/experiences/${code}/playbill`}
                className={styles.fab}
                aria-label="Open Playbill"
              >
                <BookOpen size={22} />
              </Link>
            )}
          </div>
          {avatarBtn}
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
            {!needsAvatar && experience?.playbill_enabled !== false && (
              <Link to={`/experiences/${code}/playbill`} className={styles.actionLink}>
                <Button className={styles.actionButton}>Open Playbill</Button>
              </Link>
            )}
          </div>
        </div>
        {avatarBtn}
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

          <Link
            to={`/experiences/${code}/playbill`}
            className={styles.fab}
            aria-label="Open Playbill"
          >
            <BookOpen size={22} />
          </Link>
        </div>
        {avatarBtn}
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
