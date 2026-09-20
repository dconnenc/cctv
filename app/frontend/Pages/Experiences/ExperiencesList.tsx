import { Link } from 'react-router-dom';

import { Tv } from 'lucide-react';

import { useExperiences } from '@cctv/hooks';
import { ExperienceSummary } from '@cctv/types';

import styles from './ExperiencesList.module.scss';

export default function ExperiencesList() {
  const { experiences, isLoading } = useExperiences();

  return (
    <section className="page">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Tv size={24} />
            Experiences
          </h1>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading experiences...</div>
        ) : experiences.length === 0 ? (
          <div className={styles.empty}>No experiences yet</div>
        ) : (
          <ul className={styles.list}>
            {experiences.map((experience) => (
              <ExperienceRow key={experience.id} experience={experience} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ExperienceRow({ experience }: { experience: ExperienceSummary }) {
  return (
    <li className={styles.row}>
      <div className={styles.rowInfo}>
        <span className={styles.name}>{experience.name}</span>
        <span className={styles.code}>{experience.code_slug}</span>
        <span className={styles.status}>{experience.status}</span>
      </div>
      <Link to={`/experiences/${experience.code_slug}/manage`} className={styles.manageLink}>
        Manage
      </Link>
    </li>
  );
}
