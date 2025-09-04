import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function Lobby() {
  const params = useParams();
  const rawKey = decodeURIComponent(params.sessionKey || '');

  const { isValid, displayKey } = useMemo(() => {
    const trimmed = (rawKey || '').trim();
    return {
      isValid: trimmed.length > 0,
      displayKey: trimmed,
    };
  }, [rawKey]);

  return (
    <section className="page flex-centered">
      <h3 style={{ marginBottom: '1rem' }}>{'Lobby'}</h3>
      {!isValid ? (
        <>
          <p style={{ color: 'var(--yellow)', marginBottom: '0.75rem' }}>
            {'Missing or invalid session key in the URL.'}
          </p>
          <Link className="link" to="/join">
            {'Enter a session key'}
          </Link>
        </>
      ) : (
        <>
          <p className="hero-subtitle" style={{ marginBottom: '0.75rem' }}>
            {'Session:'}
          </p>
          <p style={{ fontWeight: 600 }}>{displayKey}</p>
          <p style={{ marginTop: '1rem', opacity: 0.85 }}>{'Ready to validate and connect…'}</p>
          <Link
            className="link"
            to={`/join?session=${encodeURIComponent(displayKey)}`}
            style={{ marginTop: '0.75rem' }}
          >
            {'Continue to join'}
          </Link>
        </>
      )}
    </section>
  );
}
