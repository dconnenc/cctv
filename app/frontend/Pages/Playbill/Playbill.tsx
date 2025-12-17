import { useExperience } from '@cctv/contexts';

import styles from './Playbill.module.scss';

export default function Playbill() {
  const { experience, code, isLoading, error } = useExperience();

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Playbill'}</h1>
        <p className={styles.subtitle}>Loading playbill…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Playbill'}</h1>
        <p className={styles.subtitle}>{error}</p>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <h1 className={styles.title}>{experience?.name || code}</h1>
      <p className={styles.subtitle}>Playbill</p>
    </section>
  );
}
