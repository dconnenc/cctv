import { Link } from 'react-router-dom';

import { Button } from '@cctv/core/Button/Button';

export default function Home() {
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
        <Link to="/about" className="link">
          About CCTV
        </Link>
      </div>
    </section>
  );
}
