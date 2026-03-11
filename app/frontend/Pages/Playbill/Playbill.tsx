import { Link } from 'react-router-dom';

import { ChevronLeft } from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';

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
      <section className="page">
        <h1 className={styles.title}>{code || 'Playbill'}</h1>
        <p className={styles.subtitle}>{error}</p>
      </section>
    );
  }

  const sections = experience?.playbill || [];

  return (
    <section className={styles.root}>
      <h1 className={styles.title}>{experience?.name || code}</h1>
      <p className={styles.subtitle}>Playbill</p>

      <Link to={`/experiences/${code}`} className={styles.fab} aria-label="Back to Experience">
        <ChevronLeft size={22} />
      </Link>

      {sections.length === 0 ? (
        <div className={styles.sections}>
          <p className={styles.subtitle}>No playbill content yet.</p>
        </div>
      ) : (
        <div className={styles.sections}>
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={styles.section}
              style={section.image_url ? undefined : { gridTemplateColumns: '1fr' }}
            >
              {section.image_url && (
                <div className={styles.imageWrap}>
                  <img
                    className={styles.image}
                    src={section.image_url}
                    alt={`Section ${index + 1} Image`}
                  />
                </div>
              )}
              <div className={styles.textWrap}>
                <h3 className={styles.itemTitle}>{section.title}</h3>
                <p className={styles.itemBody}>{section.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
