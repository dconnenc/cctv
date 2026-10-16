import { Suspense, lazy } from 'react';

import { Link } from 'react-router-dom';

import { useTenant } from '@cctv/contexts';
import { Button } from '@cctv/core/Button/Button';
import { useMediaQuery } from '@cctv/hooks';

import styles from './home.module.scss';

const HomeDesktop = lazy(() => import('./HomeDesktop/HomeDesktop'));

export default function Home() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { hasFeature } = useTenant();

  if (isDesktop && hasFeature('discover')) {
    return (
      <Suspense fallback={null}>
        <HomeDesktop />
      </Suspense>
    );
  }

  return <HomeMobile />;
}

function HomeMobile() {
  const { config } = useTenant();

  return (
    <section className="page flex-centered">
      <h1>{config.theme.displayName}</h1>
      {config.theme.tagline && <p className="hero-subtitle">{config.theme.tagline}</p>}
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
