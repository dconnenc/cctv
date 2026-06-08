import { Link } from 'react-router-dom';

import { Button } from '@cctv/core/Button/Button';
import { useMediaQuery } from '@cctv/hooks';

import HomeDesktop from './HomeDesktop/HomeDesktop';

import styles from './home.module.scss';

export default function Home() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) return <HomeDesktop />;

  return <HomeMobile />;
}

function HomeMobile() {
  return (
    <section className="page flex-centered">
      <h1>{'CCTV'}</h1>
      <p className="hero-subtitle">{'CHICAGO COMEDY . TV'}</p>
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <Link to="/join" style={{ textDecoration: 'none' }}>
          <Button
            style={{
              fontSize: '1rem',
              padding: '0.75rem 2rem',
            }}
          >
            Join Show
          </Button>
        </Link>
        <Link to="/about" className={`link ${styles.aboutLink}`}>
          About
        </Link>
      </div>
    </section>
  );
}
