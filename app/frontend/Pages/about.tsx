import styles from './about.module.scss';

export default function About() {
  return (
    <section className="page flex-centered">
      {/* <h2 className="hero-title">{'About'}</h2> */}
      <p className="hero-subtitle">{'More information coming Spring 2026'}</p>

      <p className={styles.credits}>
        Map data &copy;{' '}
        <a
          className="link"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenStreetMap
        </a>{' '}
        contributors, &copy;{' '}
        <a
          className="link"
          href="https://carto.com/attributions"
          target="_blank"
          rel="noopener noreferrer"
        >
          CARTO
        </a>
      </p>
    </section>
  );
}
