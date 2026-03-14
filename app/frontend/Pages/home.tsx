import { Link } from 'react-router-dom';

import { Button } from '@cctv/core/Button/Button';

export default function Home() {
  return (
    <section className="page flex-centered">
      <h1>{'CCTV'}</h1>
      <p className="hero-subtitle">{'CHICAGO COMEDY . TV'}</p>
      <Link
        to="/join"
        style={{
          position: 'absolute',
          bottom: '25%',
          textDecoration: 'none',
        }}
      >
        <Button
          style={{
            fontSize: '1rem',
            padding: '0.75rem 2rem',
          }}
        >
          Join Show
        </Button>
      </Link>
    </section>
  );
}
