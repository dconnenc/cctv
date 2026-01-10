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
      <section className="page">
        <h1 className={styles.title}>{code || 'Playbill'}</h1>
        <p className={styles.subtitle}>{error}</p>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <h1 className={styles.title}>{experience?.name || code}</h1>
      <p className={styles.subtitle}>Playbill</p>

      {/* Placeholder sections; replace with CMS-driven content later */}
      <div className={styles.sections}>
        {[1, 2, 3, 4].map((n) => {
          const image = `https://picsum.photos/seed/playbill-${n}/800/600`;
          const title = `Playbill Item ${n}`;
          const body =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet.';
          return (
            <div key={n} className={styles.section}>
              <div className={styles.imageWrap}>
                <img className={styles.image} src={image} alt={title} />
              </div>
              <div className={styles.textWrap}>
                <h3 className={styles.itemTitle}>{title}</h3>
                <p className={styles.itemBody}>{body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
