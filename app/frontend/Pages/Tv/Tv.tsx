import { useExperience } from '@cctv/contexts';
import { ExperienceBlockContainer } from '@cctv/experiences';

import QRCodeDisplay from '../Manage/QRCodeDisplay/QRCodeDisplay';

import styles from './Tv.module.scss';

export default function Tv() {
  const { tvView, code, isLoading, error } = useExperience();

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.subtitle}>Preparing TV view…</p>
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

  if (!tvView) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code}</h1>
        <p className={styles.subtitle}>Loading TV view...</p>
      </section>
    );
  }

  const currentBlock = tvView.blocks[0];

  return (
    <section className={styles.root}>
      {currentBlock ? (
        <div className={styles.blockContainer}>
          <ExperienceBlockContainer block={currentBlock} disabled />
        </div>
      ) : (
        <div className={styles.qrContainer}>
          <QRCodeDisplay experience={tvView} />
        </div>
      )}
    </section>
  );
}
