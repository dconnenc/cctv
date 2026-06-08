import styles from './about.module.scss';

export default function About() {
  return (
    <section className={`page flex-centered ${styles.about}`}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{'CCTV'}</h1>
        <p className={styles.tagline}>{'Chicago Comedy . TV'}</p>
        <p className={styles.lead}>
          {
            'We build interactive experiences for live audiences — shows where the crowd is part of the cast. Pull out your phone, join the broadcast, and help shape what happens on stage in real time.'
          }
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>{'What we do today'}</h2>
        <p className={styles.body}>
          {
            'Right now we produce interactive comedy shows. The audience votes, answers, guesses, and reacts in the moment, and every response feeds straight into the performance. No two nights play out the same way, because the room writes the show alongside the performers.'
          }
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>{'Where we are headed'}</h2>
        <p className={styles.body}>
          {
            'Our next act is a dedicated studio space in the city — a home for producing streamed theater and filmed entertainment. A place to record live, broadcast to audiences anywhere, and turn the same interactive format we love into shows people can watch from their couch or their seat in the house.'
          }
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>{'Learning the craft'}</h2>
        <p className={styles.body}>
          {
            'The studio will also be a classroom. We plan to offer education in performance, production, and the technology behind interactive media — sharing the tools and techniques we use, and giving the next generation of makers a stage and a camera to learn on.'
          }
        </p>
      </div>

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
