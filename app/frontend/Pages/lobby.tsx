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
      {!isValid ? (
        <>
          <p style={{ color: 'var(--yellow)', marginBottom: '0.75rem' }}>
            {'missing or invalid session key in the URL.'}
          </p>
          <Link className="link" to="/join">
            {'Enter a session key'}
          </Link>
        </>
      ) : (
        <>
          <h5 style={{ marginBottom: '1rem' }}>{'Lobby:'}</h5>
          <p style={{ fontWeight: 600 }}>{displayKey}</p>
          {/* <p style={{ marginTop: '1rem', opacity: 0.85 }}>{'ready to validate and connect…'}</p> */}
          <form>
            <input
              className="join-input"
              type="text"
              name="user-display-name"
              placeholder="enter display name"
            />
          </form>
          <Link
            className="link"
            to={`/join?session=${encodeURIComponent(displayKey)}`}
            style={{
              marginTop: '0.75rem',
              border: '1px solid var(--yellow)',
              borderRadius: 4,
              padding: '6px 12px',
            }}
          >
            {'click to join'}
          </Link>
        </>
      )}
    </section>
  );
}
