import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { LobbyAvatarEditor } from '@cctv/components';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUser } from '@cctv/contexts/UserContext';

import styles from './Experience.module.scss';

export default function Avatar() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const { experience, code, isLoading, error } = useExperience();

  useEffect(() => {
    if (isAdmin) {
      navigate(`/experiences/${code}`);
    }
  }, [isAdmin, code, navigate]);

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
      </section>
    );
  }

  return (
    <section className="page">
      <div className={styles.experienceInfo}>
        <h2 className={styles.experienceName}>{experience?.name || code}</h2>
        <p className={styles.experienceStatus}>Draw your avatar to enter the lobby</p>
      </div>
      <div className={styles.avatarEditor}>
        <LobbyAvatarEditor onFinalize={() => navigate(`/experiences/${code}`)} />
      </div>
    </section>
  );
}
