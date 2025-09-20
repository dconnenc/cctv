import { useExperience } from '@cctv/contexts/ExperienceContext';

import styles from './Manage.module.scss';

export default function Manage() {
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

  // Fallback
  return (
    <section className="page flex-centered">
      <h1 className={styles.title}>{code}</h1>
      <p className={styles.subtitle}>Initializing experience...</p>
    </section>
  );
}
