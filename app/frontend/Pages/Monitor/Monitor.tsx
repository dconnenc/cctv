import { useExperience } from '@cctv/contexts/ExperienceContext';
import ExperienceBlockContainer from '@cctv/experiences/ExperienceBlockContainer/ExperienceBlockContainer';
import { BlockKind } from '@cctv/types';

import QRCodeDisplay from '../Manage/QRCodeDisplay/QRCodeDisplay';
import LobbyAvatars from './LobbyAvatars';
import ParticipantsMenu from './ParticipantsMenu';

import styles from './Monitor.module.scss';

export default function Monitor() {
  const { monitorView, code, isLoading, error } = useExperience();

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.subtitle}>Preparing Monitor view…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.error}>{error || 'Something went wrong'}</p>
      </section>
    );
  }

  if (!monitorView) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code}</h1>
        <p className={styles.subtitle}>Loading Monitor view...</p>
      </section>
    );
  }

  const currentBlock = monitorView.blocks[0];

  const showProgramBlock = !!currentBlock;
  const showParticipantNotification = !showProgramBlock && !!monitorView.participant_block_active;

  const showingBalloonPodium =
    currentBlock?.kind === BlockKind.MINIGAME_BALLOON_PUMP &&
    !!currentBlock.payload.ended_at &&
    (currentBlock.payload.podium?.length ?? 0) > 0;

  return (
    <section className={styles.root}>
      {!showingBalloonPodium && <LobbyAvatars />}
      {showProgramBlock ? (
        <div className={styles.blockContainer}>
          <ExperienceBlockContainer block={currentBlock} disabled viewContext="monitor" />
        </div>
      ) : (
        <>
          {showParticipantNotification && (
            <div className={styles.participantNotification}>Check your devices</div>
          )}
          <ParticipantsMenu />
          <div className={styles.qrContainer}>
            <QRCodeDisplay experience={monitorView} />
          </div>
        </>
      )}
    </section>
  );
}
