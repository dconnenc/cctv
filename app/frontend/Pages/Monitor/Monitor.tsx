import { useExperience } from '@cctv/contexts';
import { ExperienceBlockContainer } from '@cctv/experiences';

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

  return (
    <section className={styles.root}>
      {showProgramBlock ? (
        <div className={styles.blockContainer}>
          <ExperienceBlockContainer block={currentBlock} disabled viewContext="monitor" />
        </div>
      ) : (
        <>
          <ParticipantsMenu />
          <LobbyAvatars />
          <div className={styles.qrContainer}>
            <QRCodeDisplay experience={monitorView} compact />
          </div>
        </>
      )}
    </section>
  );
}
